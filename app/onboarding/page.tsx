"use client";

import { useState } from "react";
import { AdminShell } from "../components/AdminShell";
import { Plus, Trash2, Edit2, Check, X, AlertTriangle } from "lucide-react";

interface QuestionMock {
  id: string;
  text: string;
  type: "single" | "multiple";
  options: { id: string; label: string }[];
}

const initialQuestions: QuestionMock[] = [
  {
    id: "q1",
    text: "Which best describes your current life stage as a couple?",
    type: "single",
    options: [
      { id: "q1-career", label: "Building careers" },
      { id: "q1-family", label: "Family first" },
      { id: "q1-settled", label: "Newly settled" },
      { id: "q1-living", label: "Living it up" },
    ],
  },
  {
    id: "q2",
    text: "How would you describe your couple 'personality'?",
    type: "multiple",
    options: [
      { id: "q2-hosts", label: "The Hosts" },
      { id: "q2-yes-couple", label: "The 'yes' couple" },
      { id: "q2-planners", label: "The Planners" },
      { id: "q2-explorers", label: "The Explorers" },
    ],
  },
  {
    id: "q3",
    text: "What are your favorite activities to do with other couples?",
    type: "multiple",
    options: [
      { id: "q3-dinners-home", label: "Dinners at home" },
      { id: "q3-restaurants", label: "Exploring new restaurants" },
      { id: "q3-outdoor", label: "Outdoor activities/nature" },
      { id: "q3-cultural", label: "Cultural events/museums" },
      { id: "q3-drinks", label: "Casual drinks" },
      { id: "q3-trips", label: "Weekend trips/travel" },
    ],
  },
];

export default function OnboardingMockPage() {
  const [questions, setQuestions] = useState<QuestionMock[]>(initialQuestions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const handleDelete = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleUpdate = (id: string, updates: Partial<QuestionMock>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const addOption = (qId: string) => {
    const q = questions.find(q => q.id === qId);
    if (!q) return;
    const newOpt = { id: `${qId}-new-${Date.now()}`, label: "New Option" };
    handleUpdate(qId, { options: [...q.options, newOpt] });
  };

  const removeOption = (qId: string, optId: string) => {
    const q = questions.find(q => q.id === qId);
    if (!q) return;
    handleUpdate(qId, { options: q.options.filter(o => o.id !== optId) });
  };

  const addQuestion = () => {
     const newQ: QuestionMock = {
        id: `q-new-${Date.now()}`,
        text: "New Question Text?",
        type: "single",
        options: [{ id: "opt-1", label: "Option 1" }]
     };
     setQuestions([...questions, newQ]);
     setEditingId(newQ.id);
  };

  return (
    <AdminShell
      title="Onboarding Flow Mock"
      subtitle="Preview and design the onboarding journey without affecting live data."
    >
      <div className="alert-banner" role="note">
        <AlertTriangle size={18} />
        <span>
          <strong>Preview only.</strong> Changes here are not saved and do not affect the live app.
          This screen is a design mock for planning the onboarding flow.
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
         <div className="tabRow">
            <button 
              className={`tabLink ${!previewMode ? "active" : ""}`}
              onClick={() => setPreviewMode(false)}
            >
               Editor
            </button>
            <button 
              className={`tabLink ${previewMode ? "active" : ""}`}
              onClick={() => setPreviewMode(true)}
            >
               App Preview
            </button>
         </div>
         <button className="buttonPrimary" onClick={addQuestion}>
            <Plus size={18} /> Add Question
         </button>
      </div>

      {!previewMode ? (
        <div className="questionStack">
           {questions.map((q, idx) => (
              <div className={`glassCard questionCard ${editingId === q.id ? "editing" : ""}`} key={q.id}>
                 <div className="qHeader">
                    <div className="qInfo">
                       <span className="qNumber">Q{idx + 1}</span>
                       {editingId === q.id ? (
                         <input 
                           className="qInput" 
                           value={q.text} 
                           onChange={e => handleUpdate(q.id, { text: e.target.value })}
                           autoFocus
                         />
                       ) : (
                         <h3>{q.text}</h3>
                       )}
                    </div>
                    <div className="qActions">
                       {editingId === q.id ? (
                         <button className="btnIcon success" onClick={() => setEditingId(null)}><Check size={18} /></button>
                       ) : (
                         <button className="btnIcon" onClick={() => setEditingId(q.id)}><Edit2 size={16} /></button>
                       )}
                       <button className="btnIcon danger" onClick={() => handleDelete(q.id)}><Trash2 size={16} /></button>
                    </div>
                 </div>

                 <div className="qBody">
                    <div className="typeToggle">
                       <label>Input Type:</label>
                       <select 
                         value={q.type} 
                         onChange={e => handleUpdate(q.id, { type: e.target.value as QuestionMock["type"] })}
                       >
                          <option value="single">Single Choice</option>
                          <option value="multiple">Multiple Choice</option>
                       </select>
                    </div>

                    <div className="optionsGrid">
                       {q.options.map((opt) => (
                          <div className="optionItem" key={opt.id}>
                             {editingId === q.id ? (
                               <input 
                                 value={opt.label}
                                 onChange={e => {
                                    const next = q.options.map(o => o.id === opt.id ? {...o, label: e.target.value} : o);
                                    handleUpdate(q.id, { options: next });
                                 }}
                               />
                             ) : (
                               <span>{opt.label}</span>
                             )}
                             {editingId === q.id && (
                               <button className="optRemove" onClick={() => removeOption(q.id, opt.id)}><X size={12} /></button>
                             )}
                          </div>
                       ))}
                       {editingId === q.id && (
                         <button className="optAdd" onClick={() => addOption(q.id)}><Plus size={14} /> Add</button>
                       )}
                    </div>
                 </div>
              </div>
           ))}
        </div>
      ) : (
        <div className="previewContainer">
           <div className="phoneMock">
              <div className="phoneHeader">Onboarding</div>
              <div className="phoneBody">
                 {questions.map((q, idx) => (
                    <div className="phoneQ" key={q.id}>
                       <label>Step {idx + 1} of {questions.length}</label>
                       <h3>{q.text}</h3>
                       <div className="phoneOptions">
                          {q.options.map(o => (
                            <div className="phoneOpt" key={o.id}>{o.label}</div>
                          ))}
                       </div>
                    </div>
                 ))}
                 <button className="phoneBtn">Finish Onboarding</button>
              </div>
           </div>
        </div>
      )}

      <style jsx>{`
        .alert-banner {
          background: rgba(255, 107, 0, 0.1);
          border: 1px solid rgba(255, 107, 0, 0.2);
          color: var(--accent-orange);
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 0.9rem;
        }
        .tabRow {
          display: flex;
          background: var(--surface-2);
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
        }
        .tabLink {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: none;
          color: var(--ink-muted);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .tabLink.active {
          background: var(--surface);
          color: var(--ink);
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .questionStack {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .questionCard {
          padding: 1.5rem;
          transition: border-color 0.2s;
        }
        .questionCard.editing {
          border-color: var(--accent-cool);
        }
        .qHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }
        .qInfo {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex: 1;
        }
        .qNumber {
          background: var(--surface-2);
          color: var(--accent-orange);
          font-weight: bold;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .qInput {
          background: none;
          border: none;
          border-bottom: 1px solid var(--border);
          font-size: 1.25rem;
          font-weight: 600;
          width: 100%;
          color: var(--ink);
          padding: 4px 0;
        }
        .qInput:focus {
          outline: none;
          border-color: var(--accent-cool);
        }
        .qActions {
          display: flex;
          gap: 0.5rem;
        }
        .btnIcon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--ink-muted);
        }
        .btnIcon:hover {
          background: var(--surface-2);
          color: var(--ink);
        }
        .btnIcon.success { color: var(--accent-good); }
        .btnIcon.danger { color: var(--accent-orange); }

        .typeToggle {
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.9rem;
        }
        .typeToggle select {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface-2);
        }

        .optionsGrid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
        }
        .optionItem {
          background: var(--surface-2);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          border: 1px solid var(--border);
        }
        .optionItem input {
          background: none;
          border: none;
          color: var(--ink);
          font-size: 0.9rem;
          width: 120px;
        }
        .optionItem input:focus { outline: none; }
        .optRemove {
          background: none;
          border: none;
          color: var(--accent-orange);
          cursor: pointer;
          padding: 2px;
        }
        .optAdd {
          background: none;
          border: 1px dashed var(--border);
          color: var(--ink-muted);
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .previewContainer {
          display: flex;
          justify-content: center;
          padding: 2rem 0;
        }
        .phoneMock {
          width: 375px;
          height: 700px;
          background: white;
          border: 12px solid #1a1a1a;
          border-radius: 40px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        }
        .phoneHeader {
          padding: 60px 20px 20px;
          text-align: center;
          font-weight: bold;
          font-size: 1.1rem;
          background: #f8f9fa;
        }
        .phoneBody {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background: white;
          color: #333;
        }
        .phoneQ {
          margin-bottom: 2rem;
        }
        .phoneQ label {
          color: #999;
          font-size: 0.8rem;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.5rem;
        }
        .phoneQ h3 {
          margin: 0 0 1rem;
          font-size: 1.3rem;
        }
        .phoneOptions {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .phoneOpt {
          border: 1px solid #eee;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.9rem;
          transition: background 0.2s;
        }
        .phoneOpt:hover { background: #f0f4ff; border-color: #6366f1; }
        .phoneBtn {
          background: #6366f1;
          color: white;
          width: 100%;
          padding: 16px;
          border-radius: 16px;
          border: none;
          font-weight: bold;
          margin-top: 1rem;
        }
      `}</style>
    </AdminShell>
  );
}
