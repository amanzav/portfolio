# Auto Park repository evidence

Reviewed 2026-11-23 against commit `453b68740f508cafa633d7c9ea3035f83b77110d` of [KEV-MA/auto_park](https://github.com/KEV-MA/auto_park/tree/453b68740f508cafa633d7c9ea3035f83b77110d).
This is source inspection, not a reproduced training run.
No prototype files were changed for this review.

## What the repository supports

The README identifies an ME 599 reinforcement-learning parking project at Waterloo, using Gym and PyBullet.
It reports PPO and TRPO experiments for goal navigation, followed by an experiment where an RRT* planner with Reeds-Shepp connections supplies a path and the learned policy controls the car along it.
PPO and TRPO are alternative policy-training methods, not consecutive stages of the driving pipeline.
The README says a policy could learn a particular path but failed to generalize across arbitrary paths, even after experiments with several dozen paths.
Those are reported observations, not a quantitative PPO-versus-TRPO comparison.
[README](https://github.com/KEV-MA/auto_park/blob/453b68740f508cafa633d7c9ea3035f83b77110d/README.md)

The current `main.py` retains a commented Stable-Baselines3 PPO training block, and the repository contains multiple PPO-named saved checkpoints.
Its active training and loading branches now use TD3, so running the default entry point is not equivalent to reproducing the earlier PPO experiment.
The custom TRPO entry point remains active in `main_custom.py`.
It loads a checkpoint, uses an 11-input, 64-hidden-unit, two-output network, and can train with 5,000-step batches for 100 iterations.
These are code configurations, not proof every configured run completed.
[main.py](https://github.com/KEV-MA/auto_park/blob/453b68740f508cafa633d7c9ea3035f83b77110d/main.py), [main_custom.py](https://github.com/KEV-MA/auto_park/blob/453b68740f508cafa633d7c9ea3035f83b77110d/main_custom.py), [checkpoints](https://github.com/KEV-MA/auto_park/tree/453b68740f508cafa633d7c9ea3035f83b77110d/checkpoints)

## What the controller sees and does

The observation is an 11-value vector: car position `(x, y)`, heading as `(cos θ, sin θ)`, planar velocity `(vx, vy)`, current waypoint `(x, y, θ)`, distance to that waypoint, and heading difference.
A stale observation-space comment mentions left/right obstacle distances, but the actual concatenated vector does not contain obstacle-distance or camera inputs.
The simulator supplies state directly.
The rendered camera view is for display, not the policy observation.
[environment](https://github.com/KEV-MA/auto_park/blob/453b68740f508cafa633d7c9ea3035f83b77110d/sim_env/simple_driving_env.py#L147), [car state](https://github.com/KEV-MA/auto_park/blob/453b68740f508cafa633d7c9ea3035f83b77110d/sim_env/car.py)

The two continuous actions are throttle and steering angle.
Throttle is clipped to `[-0.6, 0.6]`, steering to `[-0.8, 0.8]`, and simulated wheel velocity responds to throttle plus simple drag/rolling resistance.
The environment advances at a configured 1/30-second timestep.
[car actions](https://github.com/KEV-MA/auto_park/blob/453b68740f508cafa633d7c9ea3035f83b77110d/sim_env/car.py), [environment timestep](https://github.com/KEV-MA/auto_park/blob/453b68740f508cafa633d7c9ea3035f83b77110d/sim_env/simple_driving_env.py#L25)

The active step reward favors velocity aligned with the local path direction and penalizes distance and heading error to the current waypoint.
It adds waypoint/goal rewards and penalties for collisions or leaving the map.
The goal reward also attempts to account for final heading and parking speed.
Avoid printing a simplified reward equation as exact implementation: the final expression uses `np.max(value, 0)`, where `0` is the axis argument rather than a scalar clamp, and zero-speed direction normalization is not guarded.
For an accessible explanation, describe the intended behaviors and leave the implementation caveats in engineering notes.
[reward and termination](https://github.com/KEV-MA/auto_park/blob/453b68740f508cafa633d7c9ea3035f83b77110d/sim_env/simple_driving_env.py#L83-L148)

## Planner and generalization boundary

`generate_path` invokes `RRTStarReedsShepp`, then `save_paths` reverses the returned goal-to-start list into the order followed by the controller.
The current environment sets `num_paths = 1`, so resets select from one pregenerated path in that instance.
The README describes broader historical experiments, but the current configuration is not evidence of held-out-path testing.
[environment path generation](https://github.com/KEV-MA/auto_park/blob/453b68740f508cafa633d7c9ea3035f83b77110d/sim_env/simple_driving_env.py#L150), [current path count](https://github.com/KEV-MA/auto_park/blob/453b68740f508cafa633d7c9ea3035f83b77110d/sim_env/simple_driving_env.py#L35)

The planner file credits Atsushi Sakai's sample code.
The TRPO implementation credits an upstream implementation for conjugate gradient.
Explain integration and experimentation without implying original invention of those algorithms or sole authorship of the repository.
The code shows TRPO-specific machinery including a KL-divergence limit, Fisher-vector products, conjugate gradient, and backtracking line search.
Those are useful technical details, but the article should not imply a verified theoretical guarantee or a proven performance advantage over PPO.
[planner attribution](https://github.com/KEV-MA/auto_park/blob/453b68740f508cafa633d7c9ea3035f83b77110d/rrt_star_reeds_shepp.py), [TRPO implementation and attribution](https://github.com/KEV-MA/auto_park/blob/453b68740f508cafa633d7c9ea3035f83b77110d/agent.py)

## Current article mismatch

The current prototype article describes UWAFT, ROS 2, YOLOv8/stereo/lidar perception, a 20 cm occupancy map, Hybrid A*, PID tracking, a late-stage open-loop commit point, and 52 CARLA scenarios.
This repository does not substantiate that pipeline or those measurements.
It contains PyBullet state-based learning, RRT* with Reeds-Shepp connections, and PPO/TRPO/TD3 experiment entry points instead.
Keep any separately confirmed UWAFT work distinct rather than silently combining it with this RL project.
The CAN utility uses placeholder IDs and is not integrated into the shown training loop, so it does not establish real-car deployment.
[current prototype](/Users/aman/portfolio/prototypes/robot-arm/autopark/index.html), [repository tree](https://github.com/KEV-MA/auto_park/tree/453b68740f508cafa633d7c9ea3035f83b77110d), [CAN utility](https://github.com/KEV-MA/auto_park/blob/453b68740f508cafa633d7c9ea3035f83b77110d/CAN_commands.py)

## Simpler article and diagram direction

Lead with the concrete question: can a learned controller steer a simulated car into a parking spot, and can that behavior transfer to another path?
Explain goal navigation, then the later split between a geometric path planner and a learned controller.
Use one overhead car/path drawing with a marked current waypoint and two small control labels, throttle and steering.
A compact feedback annotation can show that movement changes the next observation and earns a reward during training.
Label PPO and TRPO beside the training loop as alternatives, with a small text explanation of how updates differ only after consulting their primary algorithm references.
Use a second illustration only if needed to explain the key lesson: following one practiced path did not establish reliable control on new paths.
Do not invent success percentages, training curves, sample-efficiency comparisons, or exact trajectories from saved checkpoint filenames.
