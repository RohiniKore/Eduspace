import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SidebarLayout from '../../components/layout/SidebarLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const navItems = [{ path: '/student', label: 'My Classes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> }];

const typeIcon = (type) => ({ document:'📄', video:'🎥', link:'🔗', other:'📁' }[type] || '📁');

export default function StudentMaterialsPage() {
  const { id } = useParams();
  const [materials, setMaterials] = useState([]);
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([API.get(`/classes/${id}`), API.get(`/materials/class/${id}`)])
      .then(([c, m]) => { setCls(c.data); setMaterials(m.data); })
      .catch(() => toast.error('Failed to load materials'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;

  const filtered = materials.filter(m => m.title.toLowerCase().includes(search.toLowerCase()) || m.topic?.toLowerCase().includes(search.toLowerCase()));
  const topics = [...new Set(materials.map(m => m.topic || 'General'))];

  return (
    <SidebarLayout navItems={navItems} title="Materials">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to={`/student/class/${id}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm mb-6 transition-colors">← Back to class</Link>

        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="page-title">Study Materials</h1>
            <p className="text-slate-600 text-sm mt-1">{cls?.name} · {materials.length} items</p>
          </div>
          <input className="input-field max-w-xs" placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {materials.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="font-display text-xl font-semibold text-slate-700 mb-2">No materials yet</h3>
            <p className="text-slate-500">Your teacher hasn't uploaded any materials yet.</p>
          </div>
        ) : (
          topics.map(topic => {
            const topicMaterials = filtered.filter(m => (m.topic || 'General') === topic);
            if (topicMaterials.length === 0) return null;
            return (
              <div key={topic} className="mb-8">
                <h2 className="section-title mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-400" />{topic}
                </h2>
                <div className="space-y-3">
                  {topicMaterials.map(m => (
                    <div key={m._id} className="card p-4 hover:border-slate-400/60 transition-all">
                      <div className="flex items-start gap-4">
                        <span className="text-2xl mt-0.5 flex-shrink-0">{typeIcon(m.type)}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800">{m.title}</h3>
                          {m.description && <p className="text-slate-500 text-sm mt-1">{m.description}</p>}
                          <p className="text-slate-600 text-xs mt-2">By {m.uploadedBy?.name} · {format(new Date(m.createdAt), 'MMM d, yyyy')}</p>
                          {m.link && (
                            <a href={m.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-primary-400 hover:text-primary-300 text-sm">
                              🔗 Open link →
                            </a>
                          )}
                          {m.files?.length > 0 && (
                            <div className="flex flex-col gap-3 mt-3">
                              {m.files.map((f, i) => {
                                const fileUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${f.url}`;
                                const isVideo = f.name.match(/\.(mp4|webm|ogg|mov)$/i) || m.type === 'video';
                                
                                if (isVideo) {
                                  return (
                                    <div key={i} className="mt-2">
                                      <p className="text-sm font-medium text-slate-600 mb-2">📎 {f.name}</p>
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
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </SidebarLayout>
  );
}
