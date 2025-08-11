'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  Upload,
  Download,
  Save,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

interface Pertanyaan {
  _id: string;
  pertanyaan: string;
  pilihanJawaban: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  jawabanBenar: string;
  kategori: string;
  tingkatKesulitan: string;
}

interface FormData {
  pertanyaan: string;
  pilihanJawaban: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  jawabanBenar: string;
  kategori: string;
  tingkatKesulitan: string;
}

export default function AdminPage() {
  const [pertanyaanList, setPertanyaanList] = useState<Pertanyaan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('semua');
  const [selectedTingkat, setSelectedTingkat] = useState<string>('semua');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    pertanyaan: '',
    pilihanJawaban: { a: '', b: '', c: '', d: '' },
    jawabanBenar: '',
    kategori: 'umum',
    tingkatKesulitan: 'sedang'
  });

  const kategoriOptions = [
    'umum', 'sejarah', 'sains', 'teknologi', 'olahraga', 'hiburan', 
    'geografi', 'matematika', 'sastra', 'seni', 'ekonomi', 'politik'
  ];

  const tingkatOptions = ['mudah', 'sedang', 'sulit'];

  useEffect(() => {
    loadPertanyaan();
  }, []);

  const loadPertanyaan = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pertanyaan');
      if (response.ok) {
        const data = await response.json();
        setPertanyaanList(data.data || []);
      }
    } catch (error) {
      console.error('Error loading pertanyaan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pertanyaan.trim() || 
        !formData.pilihanJawaban.a.trim() || 
        !formData.pilihanJawaban.b.trim() || 
        !formData.pilihanJawaban.c.trim() || 
        !formData.pilihanJawaban.d.trim() || 
        !formData.jawabanBenar) {
      alert('Mohon lengkapi semua field!');
      return;
    }

    try {
      if (editingId) {
        // Update existing
        await updatePertanyaan(editingId, formData);
      } else {
        // Add new
        await addPertanyaan(formData);
      }
      
      resetForm();
      loadPertanyaan();
    } catch (error) {
      console.error('Error saving pertanyaan:', error);
      alert('Gagal menyimpan pertanyaan!');
    }
  };

  const addPertanyaan = async (data: FormData) => {
    try {
      const response = await fetch('/api/pertanyaan/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.pesan || 'Gagal menambah pertanyaan');
      }
      
      const result = await response.json();
      alert(result.pesan);
      
      // Reload pertanyaan dari server
      loadPertanyaan();
    } catch (error) {
      console.error('Error adding pertanyaan:', error);
      alert(error instanceof Error ? error.message : 'Gagal menambah pertanyaan!');
    }
  };

  const updatePertanyaan = async (id: string, data: FormData) => {
    setPertanyaanList(prev => 
      prev.map(p => p._id === id ? { ...p, ...data } : p)
    );
  };

  const deletePertanyaan = async (id: string) => {
    if (confirm('Yakin ingin menghapus pertanyaan ini?')) {
      setPertanyaanList(prev => prev.filter(p => p._id !== id));
    }
  };

  const editPertanyaan = (pertanyaan: Pertanyaan) => {
    setEditingId(pertanyaan._id);
    setFormData({
      pertanyaan: pertanyaan.pertanyaan,
      pilihanJawaban: pertanyaan.pilihanJawaban,
      jawabanBenar: pertanyaan.jawabanBenar,
      kategori: pertanyaan.kategori,
      tingkatKesulitan: pertanyaan.tingkatKesulitan
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      pertanyaan: '',
      pilihanJawaban: { a: '', b: '', c: '', d: '' },
      jawabanBenar: '',
      kategori: 'umum',
      tingkatKesulitan: 'sedang'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredPertanyaan = pertanyaanList.filter(p => {
    const matchesSearch = p.pertanyaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.kategori.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKategori = selectedKategori === 'semua' || p.kategori === selectedKategori;
    const matchesTingkat = selectedTingkat === 'semua' || p.tingkatKesulitan === selectedTingkat;
    
    return matchesSearch && matchesKategori && matchesTingkat;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">Kelola pertanyaan di Google Sheets</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pertanyaan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search dan Filter */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-blue-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari pertanyaan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            >
              <option value="semua">Semua Kategori</option>
              {kategoriOptions.map(kat => (
                <option key={kat} value={kat}>{kat}</option>
              ))}
            </select>
            
            <select
              value={selectedTingkat}
              onChange={(e) => setSelectedTingkat(e.target.value)}
              className="px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            >
              <option value="semua">Semua Tingkat</option>
              {tingkatOptions.map(tingkat => (
                <option key={tingkat} value={tingkat}>{tingkat}</option>
              ))}
            </select>
            
            <button
              onClick={loadPertanyaan}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingId ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Pertanyaan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pertanyaan *
                  </label>
                  <textarea
                    value={formData.pertanyaan}
                    onChange={(e) => setFormData(prev => ({ ...prev, pertanyaan: e.target.value }))}
                    placeholder="Masukkan pertanyaan..."
                    className="w-full p-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                    rows={3}
                    required
                  />
                </div>

                {/* Pilihan Jawaban */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pilihan Jawaban *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(formData.pilihanJawaban).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-600 mb-1">
                          Pilihan {key.toUpperCase()}
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            pilihanJawaban: {
                              ...prev.pilihanJawaban,
                              [key]: e.target.value
                            }
                          }))}
                          placeholder={`Pilihan ${key.toUpperCase()}`}
                          className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Jawaban Benar & Kategori */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Jawaban Benar *
                    </label>
                    <select
                      value={formData.jawabanBenar}
                      onChange={(e) => setFormData(prev => ({ ...prev, jawabanBenar: e.target.value }))}
                      className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      required
                    >
                      <option value="">Pilih jawaban benar</option>
                      {Object.entries(formData.pilihanJawaban).map(([key, value]) => (
                        value.trim() && (
                          <option key={key} value={key}>
                            {key.toUpperCase()}: {value}
                          </option>
                        )
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kategori
                    </label>
                    <select
                      value={formData.kategori}
                      onChange={(e) => setFormData(prev => ({ ...prev, kategori: e.target.value }))}
                      className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    >
                      {kategoriOptions.map(kat => (
                        <option key={kat} value={kat}>{kat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tingkat Kesulitan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={formData.tingkatKesulitan}
                    onChange={(e) => setFormData(prev => ({ ...prev, tingkatKesulitan: e.target.value }))}
                    className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    {tingkatOptions.map(tingkat => (
                      <option key={tingkat} value={tingkat}>{tingkat}</option>
                    ))}
                  </select>
                </div>

                {/* Submit Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? 'Update Pertanyaan' : 'Simpan Pertanyaan'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Daftar Pertanyaan */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Daftar Pertanyaan ({filteredPertanyaan.length})
            </h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {/* TODO: Export to Google Sheets */}}
                className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Export ke Sheets</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Memuat pertanyaan...</p>
            </div>
          ) : filteredPertanyaan.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Tidak ada pertanyaan yang sesuai dengan filter.</p>
              <p className="text-sm mt-2">Coba ubah filter atau tambah pertanyaan baru.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPertanyaan.map((pertanyaan) => (
                <motion.div
                  key={pertanyaan._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-2 border-blue-100 rounded-xl p-4 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{pertanyaan.pertanyaan}</h3>
                      
                      {/* Pilihan Jawaban */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {Object.entries(pertanyaan.pilihanJawaban).map(([key, value]) => (
                          <div key={key} className="text-sm text-gray-600 flex items-center">
                            <span className="font-medium mr-2">{key.toUpperCase()}.</span>
                            <span>{value}</span>
                            {key === pertanyaan.jawabanBenar && (
                              <span className="ml-2 text-green-600 font-semibold">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Info tambahan */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {pertanyaan.kategori}
                        </span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {pertanyaan.tingkatKesulitan}
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => editPertanyaan(pertanyaan)}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePertanyaan(pertanyaan._id)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-3xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">📋 Informasi Penting</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• Pertanyaan akan disimpan ke Google Sheets secara otomatis</p>
            <p>• Game Master dapat memilih dan memicu pertanyaan dari daftar ini</p>
            <p>• Pastikan semua field terisi dengan benar sebelum menyimpan</p>
            <p>• Pertanyaan dapat diedit atau dihapus sesuai kebutuhan</p>
          </div>
        </div>
      </div>
    </div>
  );
} 