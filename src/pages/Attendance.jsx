import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { getActiveWorkers, getProjectsByStatus, saveAttendance, getAttendanceByDate } from '../db';
import { TopBar, Card, Button } from '../components/UI';
import { ChevronLeft, Calendar, UserCheck, Clock } from 'lucide-react';

export default function Attendance({ navigate }) {
    // eslint-disable-next-line
  const { t } = useLang();
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const activeWorkers = await getActiveWorkers();
    setWorkers(activeWorkers);
    
    const activeProjects = await getProjectsByStatus('in_progress');
    setProjects(activeProjects);
    
    // Load existing attendance for this date
    const existingAttendance = await getAttendanceByDate(selectedDate);
    const attendanceMap = {};
    existingAttendance.forEach(a => {
      attendanceMap[a.workerId] = {
        status: a.status || 'present',
        hoursWorked: a.hoursWorked || 8,
        overtime: a.overtime || 0,
        projectId: a.projectId || '',
        notes: a.notes || ''
      };
    });
    setAttendance(attendanceMap);
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const updateAttendance = (workerId, field, value) => {
    setAttendance(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        [field]: value,
        status: prev[workerId]?.status || 'present'
      }
    }));
  };

  const saveAllAttendance = async () => {
    setSaving(true);
    try {
      for (const worker of workers) {
        const record = attendance[worker.id];
        if (record && record.status !== 'absent') {
          await saveAttendance({
            workerId: worker.id,
            date: selectedDate,
            status: record.status || 'present',
            hoursWorked: record.hoursWorked || 8,
            overtime: record.overtime || 0,
            projectId: record.projectId || '',
            notes: record.notes || ''
          });
        } else if (record && record.status === 'absent') {
          // Save absence record
          await saveAttendance({
            workerId: worker.id,
            date: selectedDate,
            status: 'absent',
            hoursWorked: 0,
            overtime: 0,
            projectId: '',
            notes: record.notes || ''
          });
        }
      }
      alert('Attendance saved successfully!');
      await loadData();
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'bg-green-900 border-green-600 text-green-300';
      case 'absent': return 'bg-red-900 border-red-600 text-red-300';
      case 'half-day': return 'bg-yellow-900 border-yellow-600 text-yellow-300';
      default: return 'bg-gray-800 border-gray-600 text-gray-300';
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-24">
      <TopBar
        title="Daily Attendance"
        left={
          <button onClick={() => navigate('dashboard')} className="text-gray-400 hover:text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Date Selector */}
        <Card>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-green-400" />
            <label className="text-sm text-gray-400">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 bg-[#1e3a2a] text-white p-2 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
            />
          </div>
        </Card>

        {/* Workers List */}
        {workers.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <UserCheck size={48} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No active workers</p>
              <p className="text-sm text-gray-500 mt-1">Go to Workers tab to add workers</p>
            </div>
          </Card>
        ) : (
          workers.map(worker => {
            const workerAttendance = attendance[worker.id] || { status: 'present', hoursWorked: 8, overtime: 0, projectId: '' };
            return (
              <Card key={worker.id}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h3 className="font-semibold text-white">{worker.name}</h3>
                      <p className="text-sm text-gray-400">{worker.role}</p>
                    </div>
                    <select
                      value={workerAttendance.status || 'present'}
                      onChange={(e) => updateAttendance(worker.id, 'status', e.target.value)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(workerAttendance.status)}`}
                    >
                      <option value="present">✅ Present</option>
                      <option value="absent">❌ Absent</option>
                      <option value="half-day">🌓 Half Day</option>
                    </select>
                  </div>
                  
                  {workerAttendance.status !== 'absent' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">Hours Worked</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={14} className="text-gray-400" />
                          <input
                            type="number"
                            step="0.5"
                            value={workerAttendance.hoursWorked || 8}
                            onChange={(e) => updateAttendance(worker.id, 'hoursWorked', parseFloat(e.target.value))}
                            className="flex-1 bg-[#1e3a2a] text-white p-2 rounded border border-[#2d5a3d] focus:outline-none focus:border-green-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Overtime (hrs)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={workerAttendance.overtime || 0}
                          onChange={(e) => updateAttendance(worker.id, 'overtime', parseFloat(e.target.value))}
                          className="w-full bg-[#1e3a2a] text-white p-2 rounded border border-[#2d5a3d] focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>
                  )}
                  
                  {workerAttendance.status !== 'absent' && projects.length > 0 && (
                    <div>
                      <label className="text-xs text-gray-500">Project</label>
                      <select
                        value={workerAttendance.projectId || ''}
                        onChange={(e) => updateAttendance(worker.id, 'projectId', e.target.value)}
                        className="w-full mt-1 bg-[#1e3a2a] text-white p-2 rounded border border-[#2d5a3d] focus:outline-none focus:border-green-500"
                      >
                        <option value="">Select Project</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.projectName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-xs text-gray-500">Notes (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Arrived late, left early..."
                      value={workerAttendance.notes || ''}
                      onChange={(e) => updateAttendance(worker.id, 'notes', e.target.value)}
                      className="w-full mt-1 bg-[#1e3a2a] text-white p-2 rounded border border-[#2d5a3d] focus:outline-none focus:border-green-500 text-sm"
                    />
                  </div>
                </div>
              </Card>
            );
          })
        )}

        {/* Save Button */}
        {workers.length > 0 && (
          <Button onClick={saveAllAttendance} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save All Attendance'}
          </Button>
        )}
      </div>
    </div>
  );
}