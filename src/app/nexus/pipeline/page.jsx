'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useUser } from '@/components/layout/AppLayout';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Building2, User, DollarSign, Clock, AlertCircle } from 'lucide-react';
import styles from './nexus-pipeline.module.css';

const COLUMNS = [
  { id: 'new_lead', title: 'New Lead', color: '#3b82f6' },
  { id: 'requirement_gathering', title: 'Requirements', color: '#8b5cf6' },
  { id: 'proposal_sent', title: 'Proposal Sent', color: '#eab308' },
  { id: 'negotiation', title: 'Negotiation', color: '#f97316' },
  { id: 'closed_won', title: 'Closed Won', color: '#22c55e' },
  { id: 'closed_lost', title: 'Closed Lost', color: '#ef4444' },
];

function SortableItem({ item, activeId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${styles.card} ${isDragging ? styles.cardDragging : ''}`}
    >
      <div className={styles.cardHeader}>
        <div>
          <h4 className={styles.clientName}>{item.client_name}</h4>
          {item.company_name && (
            <div className={styles.companyName}>
              <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
              {item.company_name}
            </div>
          )}
        </div>
        <span className={styles.projectBadge}>{item.project_type}</span>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.budget}>
          <DollarSign size={14} style={{ display: 'inline', marginRight: 2, color: 'var(--gold)' }} />
          {item.budget || 'TBD'}
        </div>
        <div className={styles.date}>
          <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
          {new Date(item.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

export default function NexusPipelinePage() {
  const user = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dbError, setDbError] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    client_name: '',
    company_name: '',
    email: '',
    phone: '',
    project_type: 'Software Development',
    budget: '',
    pipeline_status: 'new_lead',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchLeads = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('nexus_leads').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching nexus leads:', error);
      if (error.code === '42P01') {
        // Table doesn't exist
        setDbError(true);
        // Load dummy data so UI is visible
        setItems([
          { id: '1', client_name: 'TechFlow Inc', company_name: 'TechFlow', project_type: 'AI Automation', budget: '$15,000', pipeline_status: 'new_lead', created_at: new Date().toISOString() },
          { id: '2', client_name: 'Global Retail', company_name: 'Retail Co', project_type: 'E-Commerce Website', budget: '$8,500', pipeline_status: 'requirement_gathering', created_at: new Date().toISOString() },
        ]);
      }
    } else {
      setItems(data || []);
      setDbError(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Is the user dropping it over a column?
    const isOverColumn = COLUMNS.some((c) => c.id === overId);
    let newStatus = '';

    if (isOverColumn) {
      newStatus = overId;
    } else {
      // Find the item it's dropped over to get its status
      const overItem = items.find((i) => i.id === overId);
      if (overItem) newStatus = overItem.pipeline_status;
    }

    const activeItem = items.find((i) => i.id === activeId);
    
    if (activeItem && newStatus && activeItem.pipeline_status !== newStatus) {
      // Optimistic update
      const oldItems = [...items];
      setItems(items.map((i) => (i.id === activeId ? { ...i, pipeline_status: newStatus } : i)));

      if (!dbError) {
        const supabase = getSupabaseClient();
        const { error } = await supabase
          .from('nexus_leads')
          .update({ pipeline_status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', activeId);

        if (error) {
          console.error('Update failed:', error);
          setItems(oldItems); // Revert on fail
        }
      }
    }
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    if (dbError) {
      alert("Database table 'nexus_leads' is not initialized yet. Run setup_nexus_tables.sql");
      return;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('nexus_leads').insert([{
      ...formData,
      created_by: user.id
    }]).select();

    if (error) {
      alert(error.message);
    } else {
      setItems([data[0], ...items]);
      setShowAddModal(false);
      setFormData({ client_name: '', company_name: '', email: '', phone: '', project_type: 'Software Development', budget: '', pipeline_status: 'new_lead' });
    }
  };

  return (
    <div className={styles.boardContainer}>
      <div className="flex-between mb-24" style={{ paddingRight: 20 }}>
        <div>
          <h1 className="page-title">Nexus Sales Pipeline</h1>
          <p className="page-subtitle">B2B & Digital Solutions Kanban Board</p>
        </div>
        <div className="flex gap-12">
          {dbError && (
            <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,0,0,0.1)', padding: '8px 16px', borderRadius: 8 }}>
              <AlertCircle size={16} />
              <span>Database not initialized. Setup script required.</span>
            </div>
          )}
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Lead
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner" style={{ alignSelf: 'center', marginTop: 40 }} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.kanbanBoard}>
            {COLUMNS.map((col) => {
              const columnItems = items.filter((item) => item.pipeline_status === col.id);
              
              return (
                <div key={col.id} className={styles.column} id={col.id}>
                  <div className={styles.columnHeader}>
                    <div className={styles.columnTitle}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                      {col.title}
                    </div>
                    <span className={styles.itemCount}>{columnItems.length}</span>
                  </div>
                  
                  <SortableContext items={columnItems.map(i => i.id)}>
                    <div className={styles.columnBody}>
                      {columnItems.map((item) => (
                        <SortableItem key={item.id} item={item} activeId={activeId} />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeId ? (
              <div className={styles.card} style={{ opacity: 0.8, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', transform: 'rotate(2deg)' }}>
                {/* Simplified preview during drag */}
                <h4 className={styles.clientName}>{items.find(i => i.id === activeId)?.client_name}</h4>
                <div className={styles.budget}>{items.find(i => i.id === activeId)?.budget}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Slide-out Add Lead Panel */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className={styles.slidePanel}>
            <div className={styles.panelHeader}>
              <h3 style={{ margin: 0, color: 'var(--text)' }}>Add Nexus Lead</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSaveLead} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className={styles.panelContent}>
                <div className="form-group">
                  <label className="form-label">Client Name *</label>
                  <input required className="form-input" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} placeholder="e.g. John Doe" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Company/Business Name</label>
                  <input className="form-input" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} placeholder="e.g. Acme Corp" />
                </div>

                <div className="form-group">
                  <label className="form-label">Project Type *</label>
                  <select className="form-select" value={formData.project_type} onChange={e => setFormData({...formData, project_type: e.target.value})}>
                    <option>Software Development</option>
                    <option>AI Automation Solution</option>
                    <option>Brand Building</option>
                    <option>E-Commerce Website</option>
                    <option>Digital Marketing</option>
                    <option>Mobile App</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated Budget</label>
                  <input className="form-input" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} placeholder="e.g. $5,000 - $10,000" />
                </div>

                <div className="flex gap-16">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Phone</label>
                    <input type="tel" className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
              </div>
              
              <div className={styles.panelFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={dbError}>Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
