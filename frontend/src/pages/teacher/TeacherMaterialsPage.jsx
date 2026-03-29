import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const navItems = [{ path: '/teacher', label: 'My Classes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> }];

export default function TeacherMaterialsPage() {
  const { id } = useParams();
  const [materials, setMaterials] = useState([]);
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', topic: 'General', type: 'document', link: '' });

  useEffect(() => {
    Promise.all([API.get(`/classes/${id}`), API.get(`/materials/class/${id}`)])
      .then(([c, m]) => { setCls(c.data); setMaterials(m.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const uploadMaterial = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const fd = new FormData();
      Object.entries({ ...form, classId: id }).forEach(([k, v]) => fd.append(k, v));
      files.forEach(f => fd.append('files', f));
      const res = await API.post('/materials', fd);
      setMaterials(p => [res.data, ...p]);
      toast.success('Material uploaded!');
      setShowUpload(false);
      setForm({ title: '', description: '', topic: 'General', type: 'document', link: '' });
      setFiles([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const deleteMaterial = async (mId) => {
    if (!confirm('Delete this material?')) return;
    try {
      await API.delete(`/materials/${mId}`);
      setMaterials(p => p.filter(m => m._id !== mId));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SidebarLayout navItems={navItems} title="Materials">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to={`/teacher/class/${id}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm mb-6 transition-colors">← {cls?.name}</Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">Study Materials</h1>
          <button onClick={() => setShowUpload(p => !p)} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Upload Material
          </button>
        </div>

        {showUpload && (
          <div className="card p-6 mb-6 animate-slide-up border-primary-500/30">
            <h3 className="section-title mb-5">Upload Material</h3>
            <form onSubmit={uploadMaterial} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                  <input className="input-field" placeholder="Material title" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Topic</label>
                  <input className="input-field" placeholder="e.g. Chapter 1, Week 2" value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select className="input-field" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    <option value="document">📄 Document</option>
                    <option value="video">🎥 Video</option>
                    <option value="link">🔗 Link</option>
                    <option value="other">📁 Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
                </div>
                {form.type === 'link' && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">URL</label>
                    <input type="url" className="input-field" placeholder="https://..." value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} />
                  </div>
                )}
                {form.type !== 'link' && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Files</label>
                    <input type="file" multiple className="input-field text-sm" onChange={e => setFiles([...e.target.files])} />
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={uploading} className="btn-primary">
                  {uploading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</span> : 'Upload'}
                </button>
                <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {materials.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="font-display text-xl font-semibold text-slate-700 mb-2">No materials yet</h3>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map(m => (
              <div key={m._id} className="card p-4 hover:border-slate-400/60 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-xl mt-0.5">{{ document:'📄', video:'🎥', link:'🔗', other:'📁' }[m.type] || '📁'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{m.title}</h3>
                        <span className="badge bg-slate-200 text-slate-600">{m.topic}</span>
                      </div>
                      {m.description && <p className="text-slate-500 text-sm">{m.description}</p>}
                      <p className="text-slate-600 text-xs mt-1">{format(new Date(m.createdAt), 'MMM d, yyyy')}</p>
                      {m.link && <a href={m.link} target="_blank" rel="noreferrer" className="text-primary-400 hover:text-primary-300 text-sm mt-1 inline-block">🔗 Open link</a>}
                      {m.files?.length > 0 && (
                        <div className="flex flex-col gap-3 mt-3">
                          {m.files.map((f, i) => {
                            const fileUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${f.url}`;
                            const isVideo = f.name.match(/\.(mp4|webm|ogg|mov)$/i) || m.type === 'video';
                            
                            if (isVideo) {
                              return (
                                <div key={i} className="mt-2 text-sm text-slate-600">
                                  <p className="mb-2 font-medium">📎 {f.name}</p>
                                  <div className="rounded-xl overflow-hidden bg-slate-950 shadow-md max-w-2xl w-full aspect-video">
                                    <video src={fileUrl} controls playsInline className="w-full h-full object-contain" />
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <a key={i} href={fileUrl} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors border border-slate-300 w-max">
                                📎 {f.name}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteMaterial(m._id)} className="btn-danger text-sm py-1.5 px-3 flex-shrink-0">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
