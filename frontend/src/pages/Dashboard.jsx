import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (!data) return <div className="p-8">Failed to load dashboard.</div>;

  const { stats, assignedTasks, recentTasks, projectsSummary } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Assigned" value={stats.totalAssigned} color="bg-blue-100 text-blue-800" />
        <StatCard label="To Do" value={stats.todo} color="bg-gray-100 text-gray-800" />
        <StatCard label="In Progress" value={stats.inProgress} color="bg-yellow-100 text-yellow-800" />
        <StatCard label="Done" value={stats.done} color="bg-green-100 text-green-800" />
        <StatCard label="Overdue" value={stats.overdue} color="bg-red-100 text-red-800" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* My Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
          {assignedTasks.length === 0 ? (
            <p className="text-gray-500">No tasks assigned to you.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {assignedTasks.map((task) => (
                <div key={task.id} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <Link to={`/projects/${task.projectId}`} className="font-medium hover:text-blue-600">
                      {task.title}
                    </Link>
                    <StatusBadge status={task.status} />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{task.project.name}</p>
                  {task.dueDate && (
                    <p className={`text-xs mt-1 ${isOverdue(task) ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          {recentTasks.length === 0 ? (
            <p className="text-gray-500">No recent activity.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentTasks.map((task) => (
                <div key={task.id} className="border rounded p-3">
                  <p className="text-sm">
                    <span className="font-medium">{task.title}</span>
                    <span className="text-gray-500"> in {task.project.name}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {task.assignee ? `Assigned to ${task.assignee.name}` : 'Unassigned'} ·{' '}
                    {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Projects Summary */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Projects Overview</h2>
        {projectsSummary.length === 0 ? (
          <p className="text-gray-500">
            No projects yet.{' '}
            <Link to="/projects" className="text-blue-600 hover:underline">
              Create one
            </Link>
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectsSummary.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="border rounded-lg p-4 hover:border-blue-400 transition"
              >
                <h3 className="font-semibold">{p.name}</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <p>{p.totalTasks} tasks · {p.members} members</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${p.totalTasks ? (p.doneTasks / p.totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs mt-1">{p.doneTasks}/{p.totalTasks} done</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    TODO: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    DONE: 'bg-green-100 text-green-700',
  };
  const labels = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function isOverdue(task) {
  return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
}
