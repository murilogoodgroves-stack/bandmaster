
import React, { useState, useMemo } from 'react';
import type { CalendarEvent, User, LockedDate, Task, Release, Tour, Festival, FundingApplication, ProductionProject } from '../types';
import { EventType } from '../types';
import { PlusIcon, TrashIcon, LockIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, TourIcon, ReleaseIcon, FundingIcon, AlertIcon } from './icons';
import { Tip } from './Tip';

type CalendarView = 'week' | 'month' | 'year';

interface UnifiedEvent {
    id: string;
    date: Date;
    title: string;
    type: EventType;
    participants: string[];
    projectId?: string;
    originalId: string;
    sourceType: 'event' | 'task' | 'release' | 'checklist' | 'show' | 'festival' | 'funding';
    reminders?: number[]; // days before event
    materials?: string[]; // links or descriptions
}

const eventTypeColors: Record<EventType, string> = {
    [EventType.Gig]: 'bg-rose-500',
    [EventType.Rehearsal]: 'bg-sky-500',
    [EventType.Studio]: 'bg-indigo-500',
    [EventType.Meeting]: 'bg-emerald-500',
    [EventType.Interview]: 'bg-amber-500',
    [EventType.Deadline]: 'bg-orange-500',
    [EventType.TaskDeadline]: 'bg-slate-500',
    [EventType.ReleaseDate]: 'bg-purple-500',
    [EventType.TourDate]: 'bg-pink-500',
    [EventType.FundingDeadline]: 'bg-teal-500',
};

const getEventTypeStyle = (type: EventType) => {
    const color = eventTypeColors[type] || 'bg-gray-600';
    const textColor = [EventType.Interview].includes(type) ? 'text-black' : 'text-white';
    const icon = {
        [EventType.TaskDeadline]: <ClockIcon className="w-3 h-3 mr-1 inline-block" />,
        [EventType.ReleaseDate]: <ReleaseIcon className="w-3 h-3 mr-1 inline-block" />,
        [EventType.TourDate]: <TourIcon className="w-3 h-3 mr-1 inline-block" />,
        [EventType.FundingDeadline]: <FundingIcon className="w-3 h-3 mr-1 inline-block" />,
    }[type];
    return { bg: color, text: textColor, icon };
};

const AddEventModal: React.FC<{
    onClose: () => void;
    onSave: (event: Omit<CalendarEvent, 'id' | 'bandId'>) => void;
    users: User[];
    initialDate: Date;
}> = ({ onClose, onSave, users, initialDate }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(initialDate.toISOString().substring(0, 16));
    const [type, setType] = useState<EventType>(EventType.Meeting);
    const [notes, setNotes] = useState('');
    const [attendeeIds, setAttendeeIds] = useState<string[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !date) return;
        onSave({ title, date, type, notes, attendeeIds });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Adicionar Novo Evento</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Título do Evento" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg" required />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg" required />
                        <select value={type} onChange={e => setType(e.target.value as EventType)} className="w-full bg-gray-700 p-2 rounded-lg">
                            {Object.values(EventType).filter(t => ![EventType.TaskDeadline, EventType.ReleaseDate, EventType.TourDate, EventType.FundingDeadline].includes(t)).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notas..." className="w-full bg-gray-700 p-2 rounded-lg" />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Salvar Evento</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EventModal: React.FC<{
  event: CalendarEvent;
  onClose: () => void;
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  users: User[];
}> = ({ event, onClose, setEvents, users }) => {
  const [editedEvent, setEditedEvent] = useState(event);

  const handleSave = () => {
    setEvents(prev => prev.map(e => e.id === editedEvent.id ? editedEvent : e));
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm("Tem a certeza que quer deletar este evento?")) {
      setEvents(prev => prev.filter(e => e.id !== event.id));
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">Editar Evento</h2>
            <div className="space-y-4">
                <input type="text" value={editedEvent.title} onChange={e => setEditedEvent({...editedEvent, title: e.target.value})} className="w-full bg-gray-700 p-2 rounded-lg" />
                <div className="grid grid-cols-2 gap-4">
                    <input type="datetime-local" value={editedEvent.date.substring(0, 16)} onChange={e => setEditedEvent({...editedEvent, date: new Date(e.target.value).toISOString()})} className="w-full bg-gray-700 p-2 rounded-lg" />
                    <select value={editedEvent.type} onChange={e => setEditedEvent({...editedEvent, type: e.target.value as EventType})} className="w-full bg-gray-700 p-2 rounded-lg">
                        {Object.values(EventType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <textarea value={editedEvent.notes} onChange={e => setEditedEvent({...editedEvent, notes: e.target.value})} rows={3} placeholder="Notas..." className="w-full bg-gray-700 p-2 rounded-lg" />
            </div>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
                 <button onClick={handleDelete} className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Deletar</button>
                <div className="flex gap-4">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button onClick={handleSave} className="bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Salvar Alterações</button>
                </div>
            </div>
        </div>
    </div>
  );
};

const ReadOnlyModal: React.FC<{ 
    unifiedEvent: UnifiedEvent; 
    onClose: () => void; 
    onDelete: () => void;
}> = ({ unifiedEvent, onClose, onDelete }) => {
    const isDeletable = ['task', 'festival', 'funding'].includes(unifiedEvent.sourceType);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">{unifiedEvent.type}</h2>
                <div className="space-y-3">
                    <p className="text-lg text-white font-semibold">{unifiedEvent.title}</p>
                    <p className="text-gray-400 flex items-center"><ClockIcon className="w-4 h-4 mr-2" />{unifiedEvent.date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    {unifiedEvent.participants.length > 0 && <p className="text-gray-400">Participantes: {unifiedEvent.participants.join(', ')}</p>}
                    {unifiedEvent.reminders && unifiedEvent.reminders.length > 0 && (
                        <p className="text-yellow-400 flex items-center"><AlertIcon className="w-4 h-4 mr-2" />Lembretes: {unifiedEvent.reminders.map(r => `${r} dias antes`).join(', ')}</p>
                    )}
                    {unifiedEvent.materials && unifiedEvent.materials.length > 0 && (
                        <div className="mt-2">
                            <p className="text-gray-300 font-semibold mb-1">Material Necessário:</p>
                            <ul className="list-disc list-inside text-sm text-gray-400">
                                {unifiedEvent.materials.map((m, i) => <li key={i}>{m}</li>)}
                            </ul>
                        </div>
                    )}
                    <p className="text-sm bg-gray-700/50 p-2 rounded-md mt-2">Este é um evento automatizado da seção {unifiedEvent.sourceType}.</p>
                </div>
                <div className="flex justify-between mt-6">
                    {isDeletable ? (
                        <button onClick={onDelete} className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Deletar Origem</button>
                    ) : <div></div>}
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Fechar</button>
                </div>
            </div>
        </div>
    );
}

interface CalendarProps {
    users: User[];
    activeBandId: string;
    events: CalendarEvent[];
    setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    releases: Release[];
    tours: Tour[];
    festivals: Festival[];
    setFestivals: React.Dispatch<React.SetStateAction<Festival[]>>;
    fundingApplications: FundingApplication[];
    setFundingApplications: React.Dispatch<React.SetStateAction<FundingApplication[]>>;
    lockedDates: LockedDate[];
    projects: ProductionProject[];
}

export const Calendar: React.FC<CalendarProps> = ({ 
    users, activeBandId, 
    events: allEvents, setEvents, 
    tasks: allTasks, setTasks,
    releases: allReleases, tours: allTours, 
    festivals: allFestivals, setFestivals,
    fundingApplications: allFundingApplications, setFundingApplications,
    lockedDates: allLockedDates, projects: allProjects 
}) => {
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all');
    const [projectFilter, setProjectFilter] = useState('all');
    const [viewMode, setViewMode] = useState<CalendarView>('month');

    const projects = useMemo(() => allProjects.filter(p => p.bandId === activeBandId), [allProjects, activeBandId]);

    const parseDate = (dateStr: string): Date => {
        try {
            const parsed = new Date(dateStr);
            if (isNaN(parsed.getTime())) {
                console.warn(`Invalid date: ${dateStr}`);
                return new Date();
            }
            return parsed;
        } catch {
            console.warn(`Error parsing date: ${dateStr}`);
            return new Date();
        }
    };

    const unifiedEvents = useMemo((): UnifiedEvent[] => {
        const allUnifiedEvents: UnifiedEvent[] = [];

        // Manual Calendar Events
        allEvents.filter(e => e.bandId === activeBandId).forEach(e => allUnifiedEvents.push({ 
            id: `event-${e.id}`, 
            date: parseDate(e.date), 
            title: e.title, 
            type: e.type, 
            participants: e.attendeeIds,
            originalId: e.id,
            sourceType: 'event'
        }));

        // Project Task Deadlines
        allTasks.filter(t => t.bandId === activeBandId).forEach(t => allUnifiedEvents.push({ 
            id: `task-${t.id}`, 
            date: parseDate(t.dueDate), 
            title: t.title, 
            type: EventType.TaskDeadline, 
            participants: [t.assignedToId], 
            projectId: t.projectId,
            originalId: t.id,
            sourceType: 'task'
        }));

        // Release Dates & Checklist items
        allReleases.filter(r => r.bandId === activeBandId).forEach(r => {
            allUnifiedEvents.push({ 
                id: `release-${r.id}`, 
                date: parseDate(r.releaseDate), 
                title: `Release: ${r.title}`, 
                type: EventType.ReleaseDate, 
                participants: [],
                originalId: r.id,
                sourceType: 'release'
            });
            r.checklist.forEach(c => {
                const deadline = parseDate(r.releaseDate);
                deadline.setDate(deadline.getDate() + c.deadlineOffsetDays);
                allUnifiedEvents.push({ 
                    id: `checklist-${c.id}`, 
                    date: deadline, 
                    title: c.text, 
                    type: EventType.TaskDeadline, 
                    participants: [c.assignedToId || ''],
                    originalId: c.id,
                    sourceType: 'checklist'
                });
            });
        });

        // Tour Dates
        allTours.filter(t => t.bandId === activeBandId).flatMap(t => t.shows).forEach(s => allUnifiedEvents.push({ 
            id: `show-${s.id}`, 
            date: parseDate(s.date), 
            title: `Show: ${s.city}`, 
            type: EventType.TourDate, 
            participants: users.map(u => u.id),
            originalId: s.id,
            sourceType: 'show'
        }));

        // Festival Deadlines - with better date handling
        allFestivals.filter(f => f.bandId === activeBandId).forEach(f => {
            const festivalDate = parseDate(f.submissionDeadline);
            allUnifiedEvents.push({ 
                id: `festival-${f.id}`, 
                date: festivalDate, 
                title: `Festival Deadline: ${f.name}`, 
                type: EventType.Deadline, 
                participants: [],
                originalId: f.id,
                sourceType: 'festival',
                reminders: [7, 3, 1], // Reminders 7, 3, and 1 day before
                materials: [`Visit: ${f.url}`]
            });
        });
        
        // Funding Application Deadlines
        allFundingApplications.filter(app => app.bandId === activeBandId).forEach(app => allUnifiedEvents.push({ 
            id: `funding-${app.id}`, 
            date: parseDate(app.deadline), 
            title: `Deadline: ${app.name}`, 
            type: EventType.FundingDeadline, 
            participants: [],
            originalId: app.id,
            sourceType: 'funding',
            reminders: [14, 7, 3],
            materials: [`Link: ${app.url || 'N/A'}`]
        }));
        
        let filtered = allUnifiedEvents;
        if (typeFilter !== 'all') {
            filtered = filtered.filter(e => e.type === typeFilter);
        }
        if (projectFilter !== 'all') {
            filtered = filtered.filter(e => e.projectId === projectFilter);
        }
        return filtered;
    }, [allEvents, allTasks, allReleases, allTours, allFestivals, allFundingApplications, activeBandId, users, typeFilter, projectFilter]);

    const handleSaveNewEvent = (eventData: Omit<CalendarEvent, 'id' | 'bandId'>) => {
        const newEvent: CalendarEvent = {
            id: `cal-${Date.now()}`,
            bandId: activeBandId,
            ...eventData
        };
        setEvents(prev => [...prev, newEvent]);
        setIsAddModalOpen(false);
    };

    const handleDeleteUnifiedEvent = (unifiedEvent: UnifiedEvent) => {
        if (!window.confirm(`Tem a certeza que quer deletar este ${unifiedEvent.sourceType}? Isso o removerá da base de dados.`)) return;

        switch (unifiedEvent.sourceType) {
            case 'event':
                setEvents(prev => prev.filter(e => e.id !== unifiedEvent.originalId));
                break;
            case 'task':
                setTasks(prev => prev.filter(t => t.id !== unifiedEvent.originalId));
                break;
            case 'festival':
                setFestivals(prev => prev.filter(f => f.id !== unifiedEvent.originalId));
                break;
            case 'funding':
                setFundingApplications(prev => prev.filter(f => f.id !== unifiedEvent.originalId));
                break;
            default:
                alert("Este item não pode ser deletado da visualização de calendário. Por favor, vá para a página de origem.");
                return;
        }
        setSelectedEventId(null);
    };

    const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    
    const getLockedMembersForDate = (date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        return allLockedDates.find(ld => ld.bandId === activeBandId && ld.date === dateString)?.members || [];
    }

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const changeYear = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(newDate.getFullYear() + offset);
        setCurrentDate(newDate);
    };

    const selectedUnifiedEvent = unifiedEvents.find(e => e.id === selectedEventId);
    const eventsForModal = allEvents.filter(e => e.bandId === activeBandId);
    
    let modalContent = null;
    if(selectedUnifiedEvent) {
        if (selectedUnifiedEvent.sourceType === 'event') {
            const eventData = eventsForModal.find(e => e.id === selectedUnifiedEvent.originalId);
            if (eventData) {
                modalContent = <EventModal event={eventData} setEvents={setEvents} onClose={() => setSelectedEventId(null)} users={users} />;
            }
        } else {
            modalContent = <ReadOnlyModal 
                unifiedEvent={selectedUnifiedEvent} 
                onClose={() => setSelectedEventId(null)} 
                onDelete={() => handleDeleteUnifiedEvent(selectedUnifiedEvent)}
            />;
        }
    }

    // Render Month View
    const renderMonthView = () => {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startDate = new Date(startOfMonth);
        startDate.setDate(startDate.getDate() - startOfMonth.getDay());
        const endDate = new Date(endOfMonth);
        endDate.setDate(endDate.getDate() + (6 - endOfMonth.getDay()));

        const calendarDays = [];
        let day = new Date(startDate);
        while (day <= endDate) {
            calendarDays.push(new Date(day));
            day.setDate(day.getDate() + 1);
        }

        return (
            <div className="flex-grow grid grid-cols-7 grid-rows-6 gap-1 bg-gray-900 p-1 rounded-lg">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(dayName => (
                    <div key={dayName} className="text-center font-bold text-gray-400 text-sm py-2">{dayName}</div>
                ))}
                {calendarDays.map((date, index) => {
                    const eventsForDay = unifiedEvents.filter(e => isSameDay(e.date, date));
                    const lockedMembers = getLockedMembersForDate(date);
                    const isToday = isSameDay(date, new Date());
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                    return (
                        <div key={index} className={`bg-gray-800 rounded-md p-1.5 flex flex-col relative overflow-hidden ${!isCurrentMonth ? 'opacity-50' : ''}`}>
                            <div className={`text-xs font-bold ${isToday ? 'bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : 'text-gray-300'}`}>
                                {date.getDate()}
                            </div>
                            <div className="flex-grow overflow-y-auto space-y-1 mt-1 text-xs pr-1">
                                {eventsForDay.map(event => {
                                    const style = getEventTypeStyle(event.type);
                                    const user = users.find(u => u.id === event.participants[0]);
                                    return (
                                        <button 
                                            key={event.id}
                                            onClick={() => setSelectedEventId(event.id)}
                                            title={event.title} 
                                            className={`w-full text-left px-1.5 py-0.5 rounded-sm truncate ${style.bg} ${style.text}`}
                                        >
                                            {(event.reminders && event.reminders.length > 0) && <AlertIcon className="w-3 h-3 mr-0.5 inline-block" />}
                                            {event.title}
                                        </button>
                                    )
                                })}
                            </div>
                            {lockedMembers.length > 0 && (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-center p-1" title={`Indisponível: ${lockedMembers.join(', ')}`}>
                                    <LockIcon className="w-4 h-4 text-yellow-400" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Render Week View
    const renderWeekView = () => {
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);
            return day;
        });

        return (
            <div className="flex-grow overflow-auto">
                <div className="grid grid-cols-7 gap-1 h-full">
                    {weekDays.map((day, i) => {
                        const dayEvents = unifiedEvents.filter(e => isSameDay(e.date, day));
                        const isToday = isSameDay(day, new Date());
                        
                        return (
                            <div key={i} className={`bg-gray-800 rounded-md p-2 flex flex-col ${isToday ? 'border-2 border-purple-600' : 'border border-gray-700'}`}>
                                <div className="font-bold text-sm mb-2">{day.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}</div>
                                <div className="flex-grow overflow-y-auto space-y-1">
                                    {dayEvents.map(event => {
                                        const style = getEventTypeStyle(event.type);
                                        return (
                                            <button
                                                key={event.id}
                                                onClick={() => setSelectedEventId(event.id)}
                                                className={`w-full text-left px-2 py-1 rounded text-xs truncate ${style.bg} ${style.text}`}
                                                title={event.title}
                                            >
                                                {event.title}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render Year View
    const renderYearView = () => {
        const year = currentDate.getFullYear();
        const months = Array.from({ length: 12 }, (_, i) => {
            const monthDate = new Date(year, i, 1);
            const monthEnd = new Date(year, i + 1, 0);
            const monthEvents = unifiedEvents.filter(e => e.date.getMonth() === i && e.date.getFullYear() === year);
            return { monthDate, monthEnd, monthEvents, month: i };
        });

        return (
            <div className="flex-grow overflow-auto">
                <div className="grid grid-cols-3 gap-4 p-4">
                    {months.map(({ monthDate, monthEvents, month }) => (
                        <div key={month} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                            <h3 className="font-bold text-center mb-2">{monthDate.toLocaleDateString('pt-BR', { month: 'long' })}</h3>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {monthEvents.slice(0, 5).map(event => (
                                    <button
                                        key={event.id}
                                        onClick={() => setSelectedEventId(event.id)}
                                        className={`w-full text-left px-2 py-1 rounded text-xs truncate ${getEventTypeStyle(event.type).bg}`}
                                        title={event.title}
                                    >
                                        {event.title}
                                    </button>
                                ))}
                                {monthEvents.length > 5 && (
                                    <p className="text-xs text-gray-400 text-center">+{monthEvents.length - 5} mais</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                     <h1 className="text-4xl font-bold">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h1>
                     <div className="flex gap-1">
                        <button onClick={() => changeMonth(-1)} title="Mês anterior" className="p-2 rounded-full hover:bg-gray-700"><ChevronLeftIcon className="w-6 h-6" /></button>
                        <button onClick={() => changeMonth(1)} title="Próximo mês" className="p-2 rounded-full hover:bg-gray-700"><ChevronRightIcon className="w-6 h-6" /></button>
                     </div>
                </div>
                 <div className="flex items-center gap-4">
                     <div className="flex gap-2">
                        <button onClick={() => setViewMode('week')} className={`px-3 py-2 rounded-lg font-medium ${viewMode === 'week' ? 'bg-spotify-green text-white' : 'bg-gray-700 text-gray-300'}`}>Semana</button>
                        <button onClick={() => setViewMode('month')} className={`px-3 py-2 rounded-lg font-medium ${viewMode === 'month' ? 'bg-spotify-green text-white' : 'bg-gray-700 text-gray-300'}`}>Mês</button>
                        <button onClick={() => setViewMode('year')} className={`px-3 py-2 rounded-lg font-medium ${viewMode === 'year' ? 'bg-spotify-green text-white' : 'bg-gray-700 text-gray-300'}`}>Ano</button>
                     </div>
                     <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-gray-700 p-2 rounded-lg text-sm">
                        <option value="all">Todos os Tipos</option>
                        {Object.values(EventType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="bg-gray-700 p-2 rounded-lg text-sm">
                        <option value="all">Todos os Projetos</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-spotify-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        <PlusIcon className="h-5 w-5 mr-2"/> Novo Evento
                    </button>
                 </div>
            </div>

            <Tip onDismiss={() => {}}>Este calendário integra tarefas, prazos e eventos de todo o app em uma única visualização. Os festivais e oportunidades de financiamento aparecem com lembretes automáticos.</Tip>

            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'year' && renderYearView()}

            {modalContent}
            {isAddModalOpen && <AddEventModal onClose={() => setIsAddModalOpen(false)} onSave={handleSaveNewEvent} users={users} initialDate={currentDate} />}
        </div>
    );
};
