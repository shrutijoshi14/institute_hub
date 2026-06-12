import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bus, Navigation, MapPin, Users, Plus, Check, Trash2, ShieldAlert } from 'lucide-react';

const TransportDashboard = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  // Forms
  const [busForm, setBusForm] = useState({ bus_number: '', capacity: '', driver_name: '', driver_phone: '', status: 'active' });
  const [routeForm, setRouteForm] = useState({ route_name: '', start_point: '', end_point: '', stops: '', fee: 0 });
  const [assignForm, setAssignForm] = useState({ student_id: '', route_id: '', bus_id: '', pickup_point: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      const busRes = await axios.get('http://localhost:5000/api/transport/buses');
      const routeRes = await axios.get('http://localhost:5000/api/transport/routes');
      const assignRes = await axios.get('http://localhost:5000/api/transport/assignments');

      setBuses(busRes.data);
      setRoutes(routeRes.data);
      setAssignments(assignRes.data);

      if (routeRes.data.length > 0 && !assignForm.route_id) {
        setAssignForm(prev => ({ ...prev, route_id: routeRes.data[0].id }));
      }
      if (busRes.data.length > 0 && !assignForm.bus_id) {
        setAssignForm(prev => ({ ...prev, bus_id: busRes.data[0].id }));
      }
    } catch (err) {
      console.error('Transport Fetch Error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBus = async (e) => {
    e.preventDefault();
    if (!busForm.bus_number || !busForm.driver_name) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/transport/buses', busForm);
      setBusForm({ bus_number: '', capacity: '', driver_name: '', driver_phone: '', status: 'active' });
      setMsg({ text: 'Vehicle registered successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to register vehicle.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBus = async (id) => {
    if (!window.confirm('Remove this bus from fleet?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/transport/buses/${id}`);
      setMsg({ text: 'Vehicle removed from fleet.', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to remove vehicle.', type: 'danger' });
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    if (!routeForm.route_name || !routeForm.start_point || !routeForm.end_point) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/transport/routes', routeForm);
      setRouteForm({ route_name: '', start_point: '', end_point: '', stops: '', fee: 0 });
      setMsg({ text: 'Route details registered!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to register route.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Delete this transport route?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/transport/routes/${id}`);
      setMsg({ text: 'Route deleted successfully.', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to delete route.', type: 'danger' });
    }
  };

  const handleAssignStudent = async (e) => {
    e.preventDefault();
    if (!assignForm.student_id || !assignForm.route_id || !assignForm.bus_id) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/transport/assignments', assignForm);
      setAssignForm(prev => ({ ...prev, student_id: '', pickup_point: '' }));
      setMsg({ text: 'Student assigned to route successfully!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: err.response?.data?.msg || 'Failed to allocate transport seat.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Remove student transport seat allocation?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/transport/assignments/${id}`);
      setMsg({ text: 'Seat allocation removed.', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: 'Failed to remove allocation.', type: 'danger' });
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <h1 className="page-title">Transport Management Office</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Configure vehicle fleet, manage routes, assign student seats, and track transport fees.</p>

      {msg.text && (
        <div style={{
          padding: '1rem',
          backgroundColor: msg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: msg.type === 'success' ? '#047857' : '#B91C1C',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: `1px solid ${msg.type === 'success' ? '#A7F3D0' : '#FCA5A5'}`,
          fontSize: '0.9rem'
        }}>
          {msg.text}
        </div>
      )}

      {/* Fleet Stats Overview */}
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}>
            <Bus size={24} />
          </div>
          <div className="stat-info">
            <h3>Registered Buses</h3>
            <div className="value">{buses.length}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', color: 'var(--secondary)' }}>
            <Navigation size={24} />
          </div>
          <div className="stat-info">
            <h3>Active Routes</h3>
            <div className="value">{routes.length}</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Allocated Students</h3>
            <div className="value">{assignments.length}</div>
          </div>
        </div>
      </div>

      <div className="grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
        {/* Manage Bus Fleet */}
        <div className="card">
          <h2>Register Bus / Vehicle</h2>
          <form onSubmit={handleCreateBus} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>License / Bus Number</label>
                <input
                  type="text"
                  value={busForm.bus_number}
                  onChange={(e) => setBusForm({ ...busForm, bus_number: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. NY-BUS-2026"
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Seating Capacity</label>
                <input
                  type="number"
                  value={busForm.capacity}
                  onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. 40"
                  required
                />
              </div>
            </div>
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Driver Name</label>
                <input
                  type="text"
                  value={busForm.driver_name}
                  onChange={(e) => setBusForm({ ...busForm, driver_name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. Joe Sullivan"
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Driver Phone</label>
                <input
                  type="text"
                  value={busForm.driver_phone}
                  onChange={(e) => setBusForm({ ...busForm, driver_phone: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. 9888877777"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '3rem', borderRadius: '12px', justifyContent: 'center' }} disabled={loading}>
              Register Vehicle
            </button>
          </form>
        </div>

        {/* Fleet Directory */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>Vehicle Fleet Directory</h2>
          <div className="table-container" style={{ flex: 1, maxHeight: '250px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Vehicle Info</th>
                  <th>Driver Details</th>
                  <th>Capacity</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {buses.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.bus_number}</strong><div style={{ fontSize: '0.75rem', color: b.status === 'active' ? 'var(--secondary)' : '#DC2626' }}>{b.status}</div></td>
                    <td>{b.driver_name}<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.driver_phone}</div></td>
                    <td>{b.capacity} Seats</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn" style={{ padding: '0.4rem', minWidth: 'auto', backgroundColor: '#FEF2F2', color: '#DC2626' }} onClick={() => handleDeleteBus(b.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
        {/* Manage Routes */}
        <div className="card">
          <h2>Create Transport Route</h2>
          <form onSubmit={handleCreateRoute} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Route Name</label>
              <input
                type="text"
                value={routeForm.route_name}
                onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                placeholder="e.g. Downtown Express"
                required
              />
            </div>
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Start Terminal</label>
                <input
                  type="text"
                  value={routeForm.start_point}
                  onChange={(e) => setRouteForm({ ...routeForm, start_point: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. Main Station"
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>End Destination</label>
                <input
                  type="text"
                  value={routeForm.end_point}
                  onChange={(e) => setRouteForm({ ...routeForm, end_point: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="e.g. Campus Building"
                  required
                />
              </div>
            </div>
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Stops / Pickup Points (CSV)</label>
                <input
                  type="text"
                  value={routeForm.stops}
                  onChange={(e) => setRouteForm({ ...routeForm, stops: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  placeholder="Stops: A, B, C"
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Monthly Route Fee (₹)</label>
                <input
                  type="number"
                  value={routeForm.fee}
                  onChange={(e) => setRouteForm({ ...routeForm, fee: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '3rem', borderRadius: '12px', justifyContent: 'center' }} disabled={loading}>
              Create Route
            </button>
          </form>
        </div>

        {/* Routes Directory */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>Routes Directory</h2>
          <div className="table-container" style={{ flex: 1, maxHeight: '270px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Route Name</th>
                  <th>Path Details</th>
                  <th>Price</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {routes.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.route_name}</strong></td>
                    <td style={{ fontSize: '0.8rem' }}>{r.start_point} &rarr; {r.end_point}<div style={{ color: 'var(--text-secondary)' }}>{r.stops}</div></td>
                    <td style={{ fontWeight: 600 }}>₹{parseFloat(r.fee).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn" style={{ padding: '0.4rem', minWidth: 'auto', backgroundColor: '#FEF2F2', color: '#DC2626' }} onClick={() => handleDeleteRoute(r.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-cols-2" style={{ gap: '2rem' }}>
        {/* Allocate Transport Seat */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={22} color="var(--primary)" /> Assign Transport Seat</h2>
          <form onSubmit={handleAssignStudent} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Student DB ID (e.g. 4)</label>
              <input
                type="number"
                value={assignForm.student_id}
                onChange={(e) => setAssignForm({ ...assignForm, student_id: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                placeholder="Enter Student Numeric ID (e.g. 4 for Nathaniel)"
                required
              />
            </div>
            <div className="grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Select Transport Route</label>
                <select
                  value={assignForm.route_id}
                  onChange={(e) => setAssignForm({ ...assignForm, route_id: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'white' }}
                  required
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.route_name} (₹{parseFloat(r.fee).toLocaleString()}/mo)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Select Allocated Vehicle</label>
                <select
                  value={assignForm.bus_id}
                  onChange={(e) => setAssignForm({ ...assignForm, bus_id: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'white' }}
                  required
                >
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>{b.bus_number} (Driver: {b.driver_name})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Pickup / Drop Point</label>
              <input
                type="text"
                value={assignForm.pickup_point}
                onChange={(e) => setAssignForm({ ...assignForm, pickup_point: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                placeholder="e.g. Terminal-B Stop"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '3rem', borderRadius: '12px', justifyContent: 'center' }} disabled={loading}>
              Allocate Passenger Seat
            </button>
          </form>
        </div>

        {/* Seat Allocations Registry */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>Passenger Seat Registry</h2>
          <div className="table-container" style={{ flex: 1, maxHeight: '310px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Vehicle & Route</th>
                  <th>Pickup</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(as => (
                  <tr key={as.id}>
                    <td><strong>{as.student_name}</strong><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{as.student_username}</div></td>
                    <td style={{ fontSize: '0.8rem' }}>Route: {as.route_name}<div style={{ color: 'var(--secondary)', fontWeight: 500 }}>Bus: {as.bus_number}</div></td>
                    <td>{as.pickup_point}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn" style={{ padding: '0.4rem', minWidth: 'auto', backgroundColor: '#FEF2F2', color: '#DC2626' }} onClick={() => handleDeleteAssignment(as.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportDashboard;
