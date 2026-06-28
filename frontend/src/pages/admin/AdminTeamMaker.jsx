import { useEffect, useState } from 'react';
import { Users, Shuffle, BrainCircuit, RefreshCw, Copy } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminTeamMaker() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  
  const [teamSize, setTeamSize] = useState(2);
  const [mode, setMode] = useState('intelligent'); // 'intelligent' or 'random'

  useEffect(() => {
    api.get('/players?status=approved').then(({ data }) => {
      setPlayers(data);
      setSelectedPlayers(data.map(p => p._id));
    }).finally(() => setLoading(false));
  }, []);

  const generateTeams = () => {
    const activePlayers = players.filter(p => selectedPlayers.includes(p._id));
    
    if (activePlayers.length === 0) {
      toast.error('No players selected.');
      return;
    }

    let pool = [...activePlayers];
    const generatedTeams = [];

    if (mode === 'intelligent') {
      // Sort by winRate descending. 
      // If winRates are the same, sort by skill level loosely or just wins.
      pool.sort((a, b) => b.winRate - a.winRate);

      // Pair strongest with weakest
      while (pool.length > 0) {
        const team = [];
        for (let i = 0; i < teamSize && pool.length > 0; i++) {
          if (i % 2 === 0) {
            // Take from the front (strongest available)
            team.push(pool.shift());
          } else {
            // Take from the back (weakest available)
            team.push(pool.pop());
          }
        }
        generatedTeams.push(team);
      }
    } else {
      // Random mode: Fisher-Yates shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      // Chunk into teams
      while (pool.length > 0) {
        generatedTeams.push(pool.splice(0, teamSize));
      }
    }

    setTeams(generatedTeams);
    toast.success('Teams generated!');
  };

  const copyToClipboard = () => {
    if (teams.length === 0) return;
    let text = "🏸 Today's Badminton Teams 🏸\n\n";
    teams.forEach((team, index) => {
      text += `Team ${index + 1}:\n`;
      team.forEach(p => {
        text += `- ${p.name} (${p.skillLevel}, ${p.winRate}%)\n`;
      });
      text += '\n';
    });
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Team Maker</h1>
          <p>Intelligently balance or randomize matches</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Settings Panel */}
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚙️ Configuration
          </h2>
          
          <div className="form-group">
            <label className="form-label">Algorithm Mode</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button 
                className={`btn ${mode === 'intelligent' ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => setMode('intelligent')}
                style={{ border: mode !== 'intelligent' ? '1px solid var(--color-border)' : 'none' }}
              >
                <BrainCircuit size={16} /> Intelligent
              </button>
              <button 
                className={`btn ${mode === 'random' ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => setMode('random')}
                style={{ border: mode !== 'random' ? '1px solid var(--color-border)' : 'none' }}
              >
                <Shuffle size={16} /> Random
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {mode === 'intelligent' ? 
                'Pairs the strongest players with the weakest players based on win rate to create perfectly balanced teams.' : 
                'Completely randomizes the player pool without considering skill levels or win rates.'}
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Players per Team</label>
            <select className="form-input" value={teamSize} onChange={e => setTeamSize(Number(e.target.value))}>
              <option value={2}>Doubles (2 per team)</option>
              <option value={1}>Singles (1 per team)</option>
              <option value={3}>Triples (3 per team)</option>
              <option value={4}>Quads (4 per team)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Playing Today ({selectedPlayers.length}/{players.length})</label>
              <button 
                type="button"
                className="btn btn-ghost btn-sm" 
                onClick={() => setSelectedPlayers(selectedPlayers.length === players.length ? [] : players.map(p => p._id))}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                {selectedPlayers.length === players.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {players.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No approved players</div>}
              {players.map(p => (
                <label key={p._id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-2)' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedPlayers.includes(p._id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedPlayers([...selectedPlayers, p._id]);
                      else setSelectedPlayers(selectedPlayers.filter(id => id !== p._id));
                    }}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ fontSize: '0.85rem' }}>{p.name} <span style={{ color: 'var(--text-muted)' }}>({p.skillLevel})</span></span>
                </label>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={generateTeams} disabled={loading || selectedPlayers.length === 0}>
            <RefreshCw size={18} /> Generate Teams
          </button>
        </div>

        {/* Results Panel */}
        <div className="card" style={{ background: 'var(--color-surface-2)' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} /> Generated Teams
            </h2>
            {teams.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={copyToClipboard}>
                <Copy size={14} /> Copy Text
              </button>
            )}
          </div>

          {teams.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-icon" style={{ fontSize: '2rem' }}>🎯</div>
              <h3 style={{ fontSize: '1rem' }}>No teams generated yet</h3>
              <p style={{ fontSize: '0.85rem' }}>Adjust settings and click generate</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {teams.map((team, index) => (
                <div key={index} style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Team {index + 1}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {team.map(p => (
                      <div key={p._id} className="flex-between" style={{ fontSize: '0.9rem' }}>
                        <span>{p.name}</span>
                        <div className="flex-gap">
                          <span className="badge badge-gray">{p.skillLevel}</span>
                          {mode === 'intelligent' && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', width: '35px', textAlign: 'right' }}>
                              {p.winRate}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
