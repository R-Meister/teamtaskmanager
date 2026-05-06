import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
    assigneeId: '',
  });
  const [filter, setFilter] = useState({ status: '', assignee: '' });

  const fetchProject = () => {
    setLoading(true);
    api
      .get(`/projects/${id}`)
      .then((res) => setProject(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      setMemberEmail('');
      setShowMemberForm(false);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...taskForm,
        assigneeId: taskForm.assigneeId ? parseInt(taskForm.assigneeId) : null,
        dueDate: taskForm.dueDate || null,
      };
      await api.post(`/projects/${id}/tasks`, payload);
      setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
      setShowTaskForm(false);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status });
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const filteredTasks =
    project?.tasks?.filter((t) => {
      if (filter.status && t.status !== filter.status) return false;
      if (filter.assignee && String(t.assigneeId) !== filter.assignee) return false;
      return true;
    }) || [];

  if (loading) return <div className="p-8">Loading project...</div>;
  if (!project) return <div className="p-8">Project not found.</div>;

  const isAdmin = project.owner.id === JSON.parse(localStorage.getItem('user'))?.id; // Simplified check

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-2">
        <Link to="/projects" className="text-blue-600 hover:underline text-sm">
          ← Back to Projects
        </Link>
      </div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-gray-600 mt-1">{project.description || 'No description'}</p>
          <p className="text-sm text-gray-500 mt-1">
            Owner: {project.owner.name} · {project.members.length} members · {project.tasks.length} tasks
          </p>
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Members</h2>
          <button
            onClick={() => setShowMemberForm(!showMemberForm)}
            className="text-blue-600 hover:underline text-sm"
          >
            {showMemberForm ? 'Cancel' : 'Add Member'}
          </button>
        </div>

        {showMemberForm && (
          <form onSubmit={handleAddMember} className="flex gap-2 mb-4">
            <input
              type="email"
              placeholder="Member email"
              className="border border-gray-300 rounded px-3 py-2 flex-1"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              required
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Add
            </button>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          {project.members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
              <span className="text-sm">
                {m.user.name} ({m.role.toLowerCase()})
              </span>
              {m.user.id !== project.ownerId && (
                <button
                  onClick={() => handleRemoveMember(m.user.id)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">Tasks</h2>
          <div className="flex gap-2">
            <select
              className="border border-gray-300 rounded px-3 py-1 text-sm"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
            <select
              className="border border-gray-300 rounded px-3 py-1 text-sm"
              value={filter.assignee}
              onChange={(e) => setFilter({ ...filter, assignee: e.target.value })}
            >
              <option value="">All Assignees</option>
              {project.members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm"
            >
              {showTaskForm ? 'Cancel' : 'New Task'}
            </button>
          </div>
        </div>

        {showTaskForm && (
          <form onSubmit={handleCreateTask} className="border rounded p-4 mb-4 space-y-3">
            <input
              type="text"
              placeholder="Task title"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={2}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            />
            <div className="flex gap-2">
              <select
                className="border border-gray-300 rounded px-3 py-2"
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
              <select
                className="border border-gray-300 rounded px-3 py-2"
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <input
                type="date"
                className="border border-gray-300 rounded px-3 py-2"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
              <select
                className="border border-gray-300 rounded px-3 py-2"
                value={taskForm.assigneeId}
                onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {project.members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Create Task
            </button>
          </form>
        )}

        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div key={task.id} className="border rounded p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                </div>
                <div className="flex gap-2">
                  <select
                    className="text-sm border rounded px-2 py-1"
                    value={task.status}
                    onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span>Priority: {task.priority.toLowerCase()}</span>
                <span>
                  Assignee: {task.assignee ? task.assignee.name : 'Unassigned'}
                </span>
                {task.dueDate && (
                  <span className={isOverdue(task) ? 'text-red-600 font-semibold' : ''}>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <p className="text-gray-500 text-center py-8">No tasks found.</p>
        )}
      </div>
    </div>
  );
}

function isOverdue(task) {
  return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
}
