'use client';

import DashboardNavbar from '../../../../components/DashboardNavbar';

import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface PatientSummary {
  patient_id: number;
  name: string;
}

interface LabTestCatalog {
  test_id: number;
  test_name: string;
  normal_range: string;
}

interface SelectedLabTest {
  localId: number;
  testId: string;
  test_name: string;
  normal_range: string;
}

export default function NewEMRPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState('');
  const [labCatalog, setLabCatalog] = useState<LabTestCatalog[]>([]);
  const [selectedLabTests, setSelectedLabTests] = useState<SelectedLabTest[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Loading...');
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadedFile, setUploadedFile] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVersions, setShowVersions] = useState(false);
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);

  const storageKeys = useMemo(() => {
    const did = doctorId ? String(doctorId) : 'unknown';
    const pid = selectedPatientId || 'none';
    return {
      draft: `emr_draft_${did}_${pid}`,
      versions: `emr_versions_${did}_${pid}`,
    };
  }, [doctorId, selectedPatientId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const [patientsResponse, profileResponse, catalogResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/doctor/patients', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/doctor/profile', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5000/api/doctor/lab-catalog', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setPatients(patientsResponse.data);
        setDoctorName(profileResponse.data.name);
        setDoctorId(profileResponse.data.Doctor.doctor_id);
        setLabCatalog(catalogResponse.data);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        alert('Failed to load data. Please log in again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [router]);

  useEffect(() => {
    const key = storageKeys.draft;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.patientId && String(d.patientId) === String(selectedPatientId)) {
          setDiagnosis(d.diagnosis || '');
          setNotes(d.notes || '');
          setPrescriptions(d.prescriptions || '');
        }
      }
    } catch { }
  }, [storageKeys.draft]);

  useEffect(() => {
    if (!doctorId || !selectedPatientId) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      try {
        const payload = {
          patientId: selectedPatientId,
          diagnosis,
          prescriptions,
          notes,
          ts: Date.now(),
        };
        localStorage.setItem(storageKeys.draft, JSON.stringify(payload));
      } catch { }
    }, 800);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [diagnosis, prescriptions, notes, selectedPatientId, doctorId, storageKeys.draft]);

  const saveVersionSnapshot = () => {
    try {
      const raw = localStorage.getItem(storageKeys.versions);
      const list = raw ? JSON.parse(raw) : [];
      const snap = {
        patientId: selectedPatientId,
        diagnosis,
        prescriptions,
        notes,
        uploadedFile,
        at: new Date().toISOString(),
      };
      const next = [snap, ...list].slice(0, 20);
      localStorage.setItem(storageKeys.versions, JSON.stringify(next));
    } catch { }
  };

  const handleSaveDraftManually = () => {
    try {
      const payload = {
        patientId: selectedPatientId,
        diagnosis,
        prescriptions,
        notes,
        ts: Date.now(),
      };
      localStorage.setItem(storageKeys.draft, JSON.stringify(payload));
    } catch { }
  };

  const handleClearDraft = () => {
    try { localStorage.removeItem(storageKeys.draft); } catch { }
  };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files) {
  //     setFile(e.target.files[0]);
  //     setUploadedFile(null);
  //     setUploadStatus('');
  //   }
  // };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Only PDF and image files are allowed!');
        return;
      }

      setFile(selectedFile);
      setUploadedFile(null);
      setUploadStatus('');
    }
  };

  const handleRemoveTest = (localId: number) => {
    setSelectedLabTests(selectedLabTests.filter(test => test.localId !== localId));
  };

  const handleAddTest = () => {
    setSelectedLabTests([...selectedLabTests, { localId: Date.now(), testId: '', test_name: '', normal_range: '' }]);
  };

  const handleTestChange = (localId: number, testId: string) => {
    const selectedItem = labCatalog.find(item => String(item.test_id) === testId);
    setSelectedLabTests(selectedLabTests.map(test =>
      test.localId === localId
        ? { ...test, testId, test_name: selectedItem?.test_name || '', normal_range: selectedItem?.normal_range || '' }
        : test
    ));
  };

  // const handleUpload = async () => {
  //   if (!file) return;
  //   setUploadStatus('Uploading...');
  //   const formData = new FormData();
  //   formData.append('document', file);

  //   try {
  //     const token = localStorage.getItem('token');
  //     const response = await axios.post('http://localhost:5000/api/doctor/upload/document', formData, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     setUploadedFile(response.data);
  //     setUploadStatus('Upload Complete!');
  //     return response.data;
  //   } catch (error) {
  //     console.error('File Upload Error:', error);
  //     setUploadStatus('Upload Failed.');
  //     return null;
  //   }
  // };

  const handleUpload = async () => {
    if (!file) return;
    setUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('document', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/doctor/upload/document',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' // Important
          },
        }
      );

      // Backend should return { url, public_id, ... }
      setUploadedFile(response.data);
      setUploadStatus('Upload Complete!');
      return response.data;
    } catch (error) {
      console.error('File Upload Error:', error);
      setUploadStatus('Upload Failed.');
      return null;
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis || !selectedPatientId) return alert('Diagnosis and patient selection are required.');

    let fileMetadata = uploadedFile;
    if (file && !uploadedFile) {
      fileMetadata = await handleUpload();
      if (!fileMetadata) return;
    }

    const labRequests = selectedLabTests.filter(t => t.testId).map(t => ({ testId: t.testId }));

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/doctor/emr',
        {
          patientId: selectedPatientId,
          doctorId,
          diagnosis,
          prescriptions,
          notes,
          fileMetadata,
          labRequests,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('✅ EMR created successfully!');
      saveVersionSnapshot();
      try { localStorage.removeItem(storageKeys.draft); } catch { }
      setDiagnosis('');
      setNotes('');
      setPrescriptions('');
      setFile(null);
      setUploadedFile(null);
      setSelectedPatientId('');
      setSelectedLabTests([]);
    } catch (error) {
      console.error('EMR Save Error:', error);
      alert('Failed to save EMR.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-100">Loading Patient Data...</h1>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* <ParticlesBackground /> */}

      <DashboardNavbar title="Doctor Portal" navLinks={[]} userName={doctorName} />

      <main className="relative z-10 container mx-auto py-12 px-6">
        <h1 className="text-5xl font-extrabold mb-10 text-cyan-200 drop-shadow-lg">
          Create New EMR & Document Linkage
        </h1>
        <p className="mb-8 text-cyan-300">Attending Physician: Dr. {doctorName}</p>

        <div className="bg-slate-800/80 backdrop-blur-md border border-cyan-700/60 p-10 rounded-2xl shadow-2xl max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="text-sm text-slate-400">Autosave is enabled for this patient.</div>
              <div className="flex gap-2">
                <button type="button" onClick={handleSaveDraftManually} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-100">Save Draft</button>
                <button type="button" onClick={() => setShowVersions(v => !v)} className="px-3 py-2 rounded bg-cyan-700 hover:bg-cyan-600 text-white">Versions</button>
                <button type="button" onClick={handleClearDraft} className="px-3 py-2 rounded bg-rose-700 hover:bg-rose-600 text-white">Clear Draft</button>
              </div>
            </div>
            {/* Patient Dropdown */}
            <div>
              <h2 className="text-2xl font-semibold text-cyan-300 border-b-2 border-cyan-500/40 pb-3 mb-4">Select Patient</h2>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-md text-slate-100 focus:border-cyan-400 focus:ring focus:ring-cyan-400/30"
                required
              >
                <option value="">-- Choose an Assigned Patient --</option>
                {patients.map((p) => (
                  <option
                    key={p.patient_id}
                    // The value sent to the backend is the ID (as a string)
                    value={p.patient_id}
                  >
                    {/* FIX: Displaying both Name and ID */}
                    Name: {p.name} & ID: {p.patient_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Clinical Info */}
            <div>
              <h2 className="text-2xl font-semibold text-cyan-300 border-b-2 border-cyan-500/40 pb-3 mb-4">Medical Notes</h2>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={2}
                placeholder="Final diagnosis..."
                className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-md text-slate-100 focus:border-cyan-400"
                required
              />
              <textarea
                value={prescriptions}
                onChange={(e) => setPrescriptions(e.target.value)}
                rows={3}
                placeholder="Prescriptions or medications..."
                className="w-full p-3 mt-4 bg-slate-700/50 border border-slate-600 rounded-md text-slate-100 focus:border-cyan-400"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Internal doctor's notes..."
                className="w-full p-3 mt-4 bg-slate-700/50 border border-slate-600 rounded-md text-slate-100 focus:border-cyan-400"
              />
            </div>

            {/* Lab Tests */}
            <div>
              <h2 className="text-2xl font-semibold text-cyan-300 border-b-2 border-cyan-500/40 pb-3 mb-4">Lab Tests Ordered</h2>
              {selectedLabTests.map((test) => (
                <div key={test.localId} className="flex flex-wrap md:flex-nowrap gap-3 mb-4">
                  <select
                    value={test.testId}
                    onChange={(e) => handleTestChange(test.localId, e.target.value)}
                    className="flex-1 p-2 bg-slate-700/50 border border-slate-600 rounded-md text-slate-100 focus:border-cyan-400"
                  >
                    <option value="">-- Select Lab Test --</option>
                    {labCatalog.map((item) => (
                      <option key={item.test_id} value={item.test_id}>
                        {item.test_name} • Range: {item.normal_range}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-slate-400 w-full md:w-1/3">Range: {test.normal_range || 'N/A'}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTest(test.localId)}
                    className="text-rose-400 hover:text-rose-500 font-semibold underline text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddTest}
                className="text-cyan-400 hover:text-cyan-300 font-bold mt-2 underline"
              >
                + Add Test
              </button>
            </div>

            {/* File Upload
            <div>
              <h2 className="text-2xl font-semibold text-cyan-300 border-b-2 border-cyan-500/40 pb-3 mb-4">Attach Document</h2>
              <input type="file" onChange={handleFileChange} className="w-full text-slate-200" />
              {uploadStatus && (
                <p className={`mt-2 text-sm ${
                  uploadStatus.includes('Complete') ? 'text-emerald-400' :
                  uploadStatus.includes('Failed') ? 'text-rose-400' : 'text-cyan-300'
                }`}>{uploadStatus}</p>
              )}
              {uploadedFile && (
                <p className="mt-2 text-sm text-cyan-200">
                  Document Uploaded: <a href={uploadedFile.url} className="underline text-cyan-400" target="_blank" rel="noopener noreferrer">View File</a>
                </p>
              )}
            </div> */}

            {/* File Upload */}
            <div>
              <h2 className="text-2xl font-semibold text-cyan-300 border-b-2 border-cyan-500/40 pb-3 mb-4">Attach Document</h2>
              <input type="file" onChange={handleFileChange} className="w-full text-slate-200" />

              {uploadStatus && (
                <p className={`mt-2 text-sm ${uploadStatus.includes('Complete') ? 'text-emerald-400' :
                    uploadStatus.includes('Failed') ? 'text-rose-400' : 'text-cyan-300'
                  }`}>{uploadStatus}</p>
              )}

              {uploadedFile && (
                <div className="mt-2 flex flex-col gap-2">
                  <span className="text-cyan-200">Document Uploaded:</span>

                  {/* Preview Button */}
                  <a
                    href={uploadedFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-cyan-400 hover:text-cyan-300"
                  >
                    Preview Document
                  </a>

                  {/* Download Button */}
                  <a
                    href={uploadedFile.url}
                    download
                    className="underline text-green-400 hover:text-green-300"
                  >
                    Download Document
                  </a>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-md hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
            >
              Finalize EMR & Save
            </button>
          </form>
          {showVersions && (
            <div className="mt-6 p-4 bg-slate-900/60 border border-slate-700 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-cyan-300">Version History</h3>
                <button onClick={() => setShowVersions(false)} className="px-2 py-1 text-sm rounded bg-slate-700 text-slate-200">Close</button>
              </div>
              <VersionList storageKey={storageKeys.versions} onRestore={(v) => {
                setDiagnosis(v.diagnosis || '');
                setPrescriptions(v.prescriptions || '');
                setNotes(v.notes || '');
                setUploadedFile(v.uploadedFile || null);
              }} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function VersionList({ storageKey, onRestore }: { storageKey: string; onRestore: (v: any) => void; }) {
  const [versions, setVersions] = useState<any[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setVersions(raw ? JSON.parse(raw) : []);
    } catch { setVersions([]); }
  }, [storageKey]);
  return (
    <div className="space-y-2">
      {versions.length === 0 ? (
        <div className="text-sm text-slate-400">No versions yet.</div>
      ) : versions.map((v, idx) => (
        <div key={idx} className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded px-3 py-2">
          <div className="text-sm text-slate-300">{new Date(v.at).toLocaleString()}</div>
          <div className="flex gap-2">
            <button onClick={() => onRestore(v)} className="px-2 py-1 text-xs rounded bg-emerald-700 hover:bg-emerald-600 text-white">Restore</button>
          </div>
        </div>
      ))}
    </div>
  );
}
