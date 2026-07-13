import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HardDrive, Image, FileText, Award, Video, BarChart2, 
  UploadCloud, Trash2, Loader, AlertCircle, Database, Search, Filter 
} from 'lucide-react';

const StorageManager = () => {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [explicitType, setExplicitType] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Load files and statistics
  const loadData = async () => {
    try {
      setLoading(true);
      const [filesRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/storage/files'),
        axios.get('http://localhost:5000/api/storage/stats')
      ]);
      setFiles(filesRes.data);
      setStats(statsRes.data);
      setError('');
    } catch (err) {
      console.error('Failed to load storage data:', err);
      setError('Failed to fetch storage data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (explicitType) {
      formData.append('file_type', explicitType);
    }

    try {
      setUploading(true);
      setError('');
      
      const loggedUser = sessionStorage.getItem('user');
      let userName = 'Administrator';
      if (loggedUser) {
        try {
          const parsed = JSON.parse(loggedUser);
          if (parsed.name) userName = parsed.name;
        } catch (_) {}
      }

      await axios.post('http://localhost:5000/api/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-user-name': userName
        }
      });

      setSelectedFile(null);
      setExplicitType('');
      // Reload stats & list
      await loadData();
    } catch (err) {
      console.error('Upload failed:', err);
      const errorMsg = err.response?.data?.msg || 'File upload failed. Ensure you do not exceed plan storage limits.';
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to permanently delete this file? This will free up storage space.')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/storage/files/${fileId}`);
      await loadData();
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete file.');
    }
  };

  // Helper to format file sizes cleanly
  const formatSize = (kb) => {
    if (kb < 1024) return `${kb} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  // Category Icon Resolver
  const getCategoryIcon = (type) => {
    switch (type) {
      case 'Image':
        return <Image size={18} className="text-blue-500" style={{ color: '#3B82F6' }} />;
      case 'Video':
        return <Video size={18} className="text-red-500" style={{ color: '#EF4444' }} />;
      case 'Certificate':
        return <Award size={18} className="text-yellow-500" style={{ color: '#F59E0B' }} />;
      case 'Report':
        return <BarChart2 size={18} className="text-green-500" style={{ color: '#10B981' }} />;
      default:
        return <FileText size={18} className="text-purple-500" style={{ color: '#8B5CF6' }} />;
    }
  };

  // Filtered file lists
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (file.uploaded_by && file.uploaded_by.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'All' || file.file_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="fade-in-pane" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', overflowY: 'auto' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <HardDrive size={32} style={{ color: 'var(--primary)' }} />
            Storage Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Monitor storage limits, organize resources, and view usage breakdowns.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Usage Analytics Panel */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          
          {/* Main Progress Indicator */}
          <div className="card" style={{ gridColumn: 'span 2', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, uppercase: 'true' }}>Tenant Volume Usage</span>
                <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {stats.total_used_gb >= 1 ? `${stats.total_used_gb.toFixed(2)} GB` : `${(stats.total_used_kb / 1024).toFixed(1)} MB`}
                  <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}> / {stats.max_storage_gb} GB Limit</span>
                </h3>
              </div>
              <Database size={36} style={{ color: 'var(--primary)', opacity: 0.8 }} />
            </div>

            {/* Premium Progress Bar */}
            <div style={{ width: '100%', height: '12px', backgroundColor: '#E2E8F0', borderRadius: '100px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ 
                width: `${stats.used_percentage}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--primary), var(--secondary))', 
                borderRadius: '100px',
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
              }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>{stats.used_percentage}% allocated volume consumed</span>
              <span>{(stats.max_storage_gb - stats.total_used_gb).toFixed(2)} GB available</span>
            </div>
          </div>

          {/* Quick Statistics Breakdown Cards */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Category Allocations</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {Object.keys(stats.breakdown).map(cat => {
                const item = stats.breakdown[cat];
                return (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getCategoryIcon(cat)}
                      <span style={{ fontWeight: 500 }}>{cat}s</span>
                    </div>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.count} files ({formatSize(item.size_kb)})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Main Grid: Upload Area & File Directory */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Upload Form Box */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Upload Workspace File</h3>
          
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Custom File Zone */}
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '12px',
              padding: '2rem 1rem',
              textAlign: 'center',
              backgroundColor: '#F8FAFC',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease-in-out'
            }}>
              <input 
                type="file" 
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%'
                }}
              />
              <UploadCloud size={36} style={{ color: 'var(--primary)', marginBottom: '0.5rem', opacity: 0.7 }} />
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedFile ? selectedFile.name : 'Choose file or drag here'}
              </p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF, DOC, Images, MP4, XLS'}
              </p>
            </div>

            {/* Explicit File Type Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Categorize As</label>
              <select
                value={explicitType}
                onChange={(e) => setExplicitType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  backgroundColor: '#FFF'
                }}
              >
                <option value="">Auto-Detect Extension</option>
                <option value="Image">Image</option>
                <option value="Document">Document</option>
                <option value="Certificate">Certificate</option>
                <option value="Video">Video</option>
                <option value="Report">Report</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={uploading || !selectedFile}
              style={{
                width: '100%',
                padding: '0.65rem',
                justifyContent: 'center',
                fontSize: '0.85rem',
                opacity: (uploading || !selectedFile) ? 0.6 : 1
              }}
            >
              {uploading ? (
                <>
                  <Loader size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Uploading...
                </>
              ) : 'Upload to Hub'}
            </button>
          </form>
        </div>

        {/* File Explorer Directory */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Controls Bar: Search & Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text"
                placeholder="Search files by name or uploader..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem 0.5rem 2.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: '#F1F5F9', padding: '0.25rem', borderRadius: '8px' }}>
                {['All', 'Image', 'Document', 'Certificate', 'Video', 'Report'].map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    style={{
                      background: typeFilter === type ? '#FFF' : 'none',
                      border: 'none',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: typeFilter === type ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      boxShadow: typeFilter === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Directory Listings Table */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px', color: 'var(--text-secondary)' }}>
              <Loader className="animate-spin" style={{ animation: 'spin 1s linear infinite', marginRight: '0.5rem' }} />
              Loading file directory...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              <HardDrive size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No matching files found.</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>Upload files on the left to add storage resources.</p>
            </div>
          ) : (
            <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Name</th>
                    <th>Category</th>
                    <th>File Size</th>
                    <th>Uploaded By</th>
                    <th>Upload Date</th>
                    <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map(file => (
                    <tr key={file.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <a 
                          href={`http://localhost:5000/${file.file_path}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ color: 'var(--primary)', hover: { textDecoration: 'underline' } }}
                        >
                          {file.name}
                        </a>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                          {getCategoryIcon(file.file_type)}
                          <span style={{ fontWeight: 500 }}>{file.file_type}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {formatSize(file.size_kb)}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {file.uploaded_by || 'Unknown'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(file.created_at).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                        <button
                          onClick={() => handleDelete(file.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#EF4444',
                            padding: '0.25rem',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            hover: { backgroundColor: '#FEE2E2' }
                          }}
                          title="Delete File"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default StorageManager;
