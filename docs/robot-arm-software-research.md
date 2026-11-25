# Circuitry and software behind the pencil arm

Research checked against primary documentation on 2026-11-16.
This is a conceptual design reference, not a hardware implementation plan.

## The real control chain

`Pointer target → reachable tool pose → joint solution → timed trajectory → joint control → motor driver → motor`

`Encoder measurements → joint/motor control → corrected commands`

| Stage | What it actually does | Implication for the portfolio |
| --- | --- | --- |
| Target and inverse kinematics (IK) | IK finds joint angles for a desired tool pose, subject to the robot's geometry and limits. MoveIt supports IK plugins and joint limits. | The cursor expresses where the gripper should go; it does not directly command a motor. |
| Motion planning | Finds a feasible route to the goal, including collision and other constraints. MoveIt checks collisions by default. | A small constrained arm can use a much simpler route generator than a general robot planning system. |
| Timed trajectory | Specifies how joint targets change over time, including velocity and acceleration constraints. MoveIt's output is a trajectory, not just an untimed path. | Smooth starts, stops and retargeting belong here. |
| Joint trajectory controller | Interpolates time-stamped joint waypoints. Its interface may send positions directly or use feedback error to calculate velocity/effort commands. | There is no universal rule that the host must calculate motor current itself. |
| Driver and motor control | Converts requested motion or torque into motor actuation. ODrive demonstrates nested position, velocity and current control. | A controller signal trace and a motor power trace represent different roles. |
| Encoder feedback | Supplies measured position, with velocity measured or estimated as appropriate. The ros2_control joint trajectory controller requires at least position feedback. | A quiet return path from the arm makes the sketch more truthful than a one-way “power makes it move” line. |

Sources: [MoveIt kinematics](https://moveit.picknik.ai/main/doc/examples/kinematics_configuration/kinematics_configuration_tutorial.html), [MoveIt motion planning](https://moveit.picknik.ai/main/doc/concepts/motion_planning.html), [ros2_control joint trajectory controller](https://control.ros.org/rolling/doc/ros2_controllers/joint_trajectory_controller/doc/userdoc.html), [ODrive controller](https://docs.odriverobotics.com/v/latest/manual/control.html).

These stages describe responsibilities, not a mandatory sequence of separate chips or programs.
Their placement depends on the hardware and application.
For example, SimpleFOC separates its motion calculation (`motor.move()`) from its torque-control calculation (`motor.loopFOC()`), and permits motion control to run less frequently than torque control. [SimpleFOC motion control](https://docs.simplefoc.com/motion_control).
ODrive likewise documents distinct feedback loops and explains why abruptly changing position targets can produce jerky movement. [ODrive controller](https://docs.odriverobotics.com/v/latest/manual/control.html).

## Does the drawing need a CPU and separate RAM?

One microcontroller unit (MCU), a chip combining processing and peripherals, is a credible centerpiece.
For example, ST's STM32G431 family combines an Arm Cortex-M4 processor with up to 128 KB of Flash and 32 KB of SRAM inside the device. [ST product documentation](https://www.st.com/en/microcontrollers-microprocessors/stm32g431cb.html), [ST datasheet](https://www.st.com/resource/en/datasheet/stm32g431cb.pdf).
Flash retains the program when power is removed; SRAM holds working state while the program runs.
Therefore, working memory is still needed, but a separate desktop-style CPU package and external RAM package are not mandatory for this conceptual small controller.

SimpleFOC's supported microcontrollers include STM32 and other small embedded platforms, demonstrating that motor-control software can run on MCUs. [SimpleFOC microcontrollers](https://docs.simplefoc.com/microcontrollers).
Whether one particular MCU can handle every arm joint, IK and higher-level planning is a separate engineering decision, not established by this example.
An external computer can handle richer planning while embedded controllers handle motors, but the portfolio drawing does not need to depict that entire architecture.

## Original illustrative control flow

The following pseudocode explains the idea; it is not copied from a library or ready to control physical hardware.
The portfolio has an existing `solveMagneticPose` function for virtual IK and `applyArmPose` for applying virtual joint angles to the model.
The encoder and driver calls below illustrate the additional closed-loop responsibilities of a physical robot.

```text
on_pointer_move(mouse):
    tool_goal = constrain_workspace(screen_to_arm_plane(mouse))
    joint_goal = inverse_kinematics(tool_goal, previous_joint_state)
    trajectory = retarget_from_current_motion(joint_goal, motion_limits)

each_control_tick(time):
    measured = encoders.read_joint_state()
    desired = trajectory.sample(time)
    command = joint_controller(desired, measured)
    motor_drivers.write(command)
```

The planning step should preserve current motion when the target changes; it should not restart a new animation from rest on every mouse event.
In the browser, model state replaces physical sensor measurements, and rendering replaces motor actuation.
This is a design analogy, not evidence that the simulated arm has real encoders or motor control.

## Two restrained ways to show software

1. **A small handwritten source note.** On deliberate hover or keyboard focus over the controller, reveal three short lines inspired by the actual implementation: `target → solveMagneticPose → applyArmPose`.
   Keep it on the paper, beside the component, with no terminal frame, scrolling text or simulated logs.
   A small “how it moves” link could expose the real source later.

2. **One causal feedback loop.** A short muted petrol signal travels toward the controller when the target changes, then toward the arm; a quieter return mark represents measured joint state in the conceptual hardware drawing.
   Keep the controller and arm stationary except for the existing purposeful arm motion, and distinguish signal routing from power routing.
   The pulse is explanatory timing, not a literal electrical propagation-speed simulation; a static annotated path can communicate the same idea with reduced motion.

The strongest software signal is the arm's behavior: reachable targets, stable joints, uninterrupted retargeting and deliberate placement.
The circuit should support that story without becoming a dashboard.

## Hardware roles behind the open-circuit concept

TI's robot-joint reference design separates DC input and voltage conversion, an MCU, power-driver stages, current sensing, encoder interfaces, external Flash, communication interfaces and debug connections.
Its motor power passes through three half-bridge stages, while the MCU supplies control signals and receives feedback.
This is a reference for functional relationships, not a parts list to reproduce on the page. [TI TIDA-010979 design guide, sections 2.1 and 2.2](https://www.ti.com/lit/ug/tiduff7a/tiduff7a.pdf).

A simpler brushed-motor example, TI's DRV8251, uses four internal MOSFETs in an H-bridge and an external current-sense resistor.
Its bypass and bulk capacitors connect across the motor supply and return; local bulk capacitance supports changing current demand and helps keep the supply stable.
The guide also distinguishes high-current routing from control inputs. [TI DRV8251 datasheet, sections 8.1, 10.1 and 11.1](https://www.ti.com/lit/ds/symlink/drv8251.pdf).

Consequences for the illustration:

- The power connector is an input, not an energy source by itself; a cable leaving the paper implies an external supply.
- Draw a supply and a return path, and distinguish them from fine control and feedback traces.
- Place the capacitor across the supply and return near the driver, rather than drawing every component in a single series chain.
- Choose a specific resistor role before routing it, such as control-signal conditioning; a current-shunt role calls for a suitable package rather than automatically using a decorative banded resistor.
- The transistor shape study can establish one reusable package, but the complete composition should imply a driver stage with multiple switches, not one transistor powering an entire multi-joint arm.
- Let the MCU command the power stage rather than drawing motor power through the CPU.
- Feedback routing should return from the arm to its controller; it is distinct from the electrical supply return.

These are conceptual layout constraints, not a verified electrical schematic.
Motor type, driver topology, ratings, protection and exact component choices remain undecided because this work is a portfolio illustration.

## Proposed distinct contact components

The following are interface metaphors, not claims that the physical parts store or transmit website links.
Keep the destination labels visible so visitors need no electronics knowledge.

| Destination | Proposed physical form | Connection to the visual system |
| --- | --- | --- |
| GitHub | A small programming/debug header with two rows of real pins and a keyed shroud | Programming connection to the central controller |
| Contact | A compact communications socket, with a recessed opening and visible contacts | Communications interface to the controller |
| Résumé | A small Flash-storage module with an edge connector | Stored information, visibly distinct from the main controller |

Reuse the approved ceramic package as the central controller instead of duplicating it for every destination.
External RAM can be explored as part of a larger computer-controller composition, but it is optional; integrated MCU working memory already gives a credible smaller arrangement.
Keep a Flash-storage metaphor distinct from RAM so the drawing does not imply that volatile memory retains a document after power removal.

## Preferred software treatment

Normal state: quiet controller lid, unobstructed traces, no permanent code panel.
On deliberate controller hover or keyboard focus: a small pencil annotation appears beside it with an actual source excerpt and bounded live joint values.
For example, the existing browser implementation already contains this line in `prototypes/robot-arm/workspace-study.js`:

```js
followPose = solveMagneticPose(hit.x,hit.y,hit.z);
```

Explain it as converting a cursor-derived target into virtual joint angles.
Do not present that browser calculation as physical motor-control firmware.
Later, a short command signal can follow the same user interaction; it should acknowledge activity rather than add an unrelated continuous light show.

## Approval checkpoints before integration

1. Separate stationary shape study: power input, resistor, capacitor and transistor, each with three-quarter, top and side views.
2. Pencil finish: verify silhouettes, ceramic/metal differences, leads, seams, mounting features and hatching against the approved arm and chip.
3. Separate shape studies for the distinct debug, communications and storage link components.
4. Static open-circuit composition: approve controller placement, routing bundles, supply return, feedback path and whitespace before any interaction.
5. Controller annotation and hover signal in the isolated view.
6. Combine the approved circuit with the main prototype only after the component and layout checkpoints are accepted.

No prototype or production UI changes were made during this research pass.
