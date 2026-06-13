import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getAllProjects, updateProjectStatus } from '../db';
import { TopBar, Card, Button } from '../components/UI';
import { ChevronLeft, Briefcase, Clock, PlayCircle, CheckCircle } from 'lucide-react';

export default function Projects({ navigate }) {
  const { t } = useLang();
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const all = await getAllProjects();
    setProjects(all);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'in_progress': return <PlayCircle size={16} className="text-blue-400" />;
      case 'completed': return <CheckCircle size={16} className="text-green-400" />;
      default: return <Clock size={16} className="text-yellow-400" />;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'not_started': return t.projects?.notStarted || 'Not Started';
      case 'in_progress': return t.projects?.inProgress || 'In Progress';
      case 'completed': return t.projects?.completed || 'Completed';
      default: return status;
    }
  };

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status === filter);

  return (
    <div className="flex flex-col min-h-full pb-24">
      <TopBar
        title={t.projects?.title || 'Projects'}
        left={
          <button onClick={() => navigate('dashboard')} className="text-gray-400 hover:text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'not_started', 'in_progress', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === status 
                  ? 'bg-green-700 text-white' 
                  : 'bg-[#1e3a2a] text-gray-400 hover:bg-[#2a4a35]'
              }`}
            >
              {status === 'all' ? 'All' : getStatusText(status)}
            </button>
          ))}
        </div>

        {/* Projects list */}
        {filteredProjects.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <Briefcase size={48} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">{t.projects?.noProjects || 'No projects yet'}</p>
              <p className="text-sm text-gray-500 mt-1">{t.projects?.acceptQuoteToCreate || 'Accept a quote to create a project'}</p>
            </div>
          </Card>
        ) : (
          filteredProjects.map(project => (
            <Card key={project.id} className="cursor-pointer hover:border-green-700 transition-colors">
              <div onClick={() => navigate('project-view', { projectId: project.id })}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{project.projectName}</h3>
                    <p className="text-sm text-gray-400">{project.quoteNumber}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#0d2014]">
                    {getStatusIcon(project.status)}
                    <span className="text-xs">{getStatusText(project.status)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm mt-3">
                  <span className="text-gray-500">Quoted:</span>
                  <span className="text-green-400 font-medium">M {project.grandTotal?.toFixed(2)}</span>
                </div>
                {project.startDate && (
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}