"use client";

import { useEffect, useState } from "react";

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

interface GitHubUser {
  public_repos: number;
  followers: number;
  created_at: string;
}

export function useGitHubData(username: string) {
  const [lastCommit, setLastCommit] = useState<GitHubCommit | null>(null);
  const [userStats, setUserStats] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGitHubData = async () => {
      try {
        // Fetch user stats
        const userRes = await fetch(`https://api.github.com/users/${username}`);
        if (!userRes.ok) throw new Error("Failed to fetch user data");
        const userData = await userRes.json();
        setUserStats(userData);

        // Fetch recent commits across all repos
        const eventsRes = await fetch(
          `https://api.github.com/users/${username}/events/public`
        );
        if (!eventsRes.ok) throw new Error("Failed to fetch events");
        const events = await eventsRes.json();

        // Find the most recent push event
        const pushEvent = events.find((event: any) => event.type === "PushEvent");
        if (pushEvent && pushEvent.payload.commits.length > 0) {
          const repoName = pushEvent.repo.name;
          const commitSha = pushEvent.payload.commits[0].sha;
          
          // Fetch detailed commit info
          const commitRes = await fetch(
            `https://api.github.com/repos/${repoName}/commits/${commitSha}`
          );
          if (commitRes.ok) {
            const commitData = await commitRes.json();
            setLastCommit(commitData);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, [username]);

  return { lastCommit, userStats, loading, error };
}

/**
 * Example component showing GitHub stats
 * You can integrate this into your Header or create a new section
 */
export function GitHubStats({ username }: { username: string }) {
  const { lastCommit, userStats, loading, error } = useGitHubData(username);

  if (loading) return <div className="text-sm text-muted">Loading GitHub stats...</div>;
  if (error) return null; // Fail silently

  const timeSinceCommit = lastCommit
    ? getTimeSince(new Date(lastCommit.commit.author.date))
    : null;

  return (
    <div className="text-sm text-muted space-y-1">
      {lastCommit && (
        <p>
          Last commit: <span className="text-foreground/80">{timeSinceCommit}</span>
        </p>
      )}
      {userStats && (
        <p>
          {userStats.public_repos} repos · {userStats.followers} followers
        </p>
      )}
    </div>
  );
}

function getTimeSince(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";

  return "just now";
}
