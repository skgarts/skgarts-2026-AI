import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { X, Loader2, FolderOpen, Upload, FolderPlus, Trash2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WixMediaFile {
  id: string;
  filename: string;
  url: string;
  mediaType?: string;
  width?: number;
  height?: number;
}

interface SelectedMedia extends WixMediaFile {
  selected: boolean;
}

declare global {
  interface Window {
    wix?: any;
  }
}

type SidebarSection = 'site-files' | 'my-boards' | 'trash';

export default function WixMediaPicker() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [wixReady, setWixReady] = useState(false);
  const [activeSection, setActiveSection] = useState<SidebarSection>('site-files');
  const [mediaFiles, setMediaFiles] = useState<WixMediaFile[]>([]);
  const [selectedInModal, setSelectedInModal] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (window.wix) {
      setWixReady(true);
    }
  }, []);

  const fetchMediaFiles = async () => {
    setIsLoading(true);
    try {
      if (window.wix?.mediaManager) {
        const result = await window.wix.mediaManager.openMediaManager({
          multiSelect: true,
          mediaTypes: ['image'],
        });

        if (result && result.files && result.files.length > 0) {
          const files: WixMediaFile[] = result.files.map((file: any) => ({
            id: file.id || crypto.randomUUID(),
            filename: file.filename || file.name || 'Untitled',
            url: file.url || '',
            mediaType: file.mediaType,
            width: file.width,
            height: file.height,
          }));
          setMediaFiles(files);
        }
      } else {
        const response = await fetch('/api/media-manager', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            multiSelect: true,
            mediaTypes: ['image'],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to fetch media files');
        }

        const result = await response.json();

        if (result.success && result.files && result.files.length > 0) {
          const files: WixMediaFile[] = result.files.map((file: any) => ({
            id: file.id || crypto.randomUUID(),
            filename: file.filename || file.name || 'Untitled',
            url: file.url || '',
            mediaType: file.mediaType,
            width: file.width,
            height: file.height,
          }));
          setMediaFiles(files);
        }
      }
    } catch (error) {
      console.error('Error fetching media files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openMediaManager = () => {
    setIsModalOpen(true);
    fetchMediaFiles();
  };

  const toggleMediaSelection = (id: string) => {
    setSelectedInModal((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const confirmSelection = () => {
    const selected = mediaFiles.filter((file) => selectedInModal.has(file.id));
    const newMedia: SelectedMedia[] = selected.map((file) => ({
      ...file,
      selected: true,
    }));
    setSelectedMedia((prev) => [...prev, ...newMedia]);
    setIsModalOpen(false);
    setSelectedInModal(new Set());
  };

  const removeMedia = (id: string) => {
    setSelectedMedia((prev) => prev.filter((media) => media.id !== id));
  };

  return (
    <div className="w-full">
      {/* Open Media Manager Button */}
      <Button
        onClick={openMediaManager}
        disabled={isLoading}
        className="bg-primary hover:bg-primary/90 text-background font-paragraph uppercase tracking-widest text-sm py-6 px-8 flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <FolderOpen className="h-4 w-4" />
            Open Media Manager
          </>
        )}
      </Button>

      {/* Full-Screen Media Manager Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-full max-w-7xl max-h-[90vh] bg-background rounded-lg shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="border-b border-secondary/10 p-6 flex items-center justify-between bg-white">
                <h2 className="font-heading text-2xl text-secondary">Media Manager</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-secondary/60 hover:text-secondary transition-colors"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Top Navigation */}
              <div className="border-b border-secondary/10 px-6 py-4 flex gap-3 bg-secondary/5">
                <Button className="bg-primary hover:bg-primary/90 text-background font-paragraph text-sm py-2 px-4 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Media
                </Button>
                <Button variant="outline" className="border-secondary/20 text-secondary hover:bg-secondary/5 font-paragraph text-sm py-2 px-4 flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" />
                  Create Folder
                </Button>
              </div>

              {/* Main Content Area */}
              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 border-r border-secondary/10 bg-secondary/5 overflow-y-auto">
                  <nav className="p-4 space-y-2">
                    {[
                      { id: 'site-files', label: 'Site Files', icon: FolderOpen },
                      { id: 'my-boards', label: 'My Boards', icon: FolderOpen },
                      { id: 'trash', label: 'Trash', icon: Trash2 },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveSection(id as SidebarSection)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors font-paragraph text-sm ${
                          activeSection === id
                            ? 'bg-primary text-background'
                            : 'text-secondary hover:bg-secondary/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {label}
                        </div>
                        {activeSection === id && <ChevronRight className="h-4 w-4" />}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Media Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="font-paragraph text-secondary/70">Loading media files...</p>
                      </div>
                    </div>
                  ) : mediaFiles.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {mediaFiles.map((file) => {
                        const isSelected = selectedInModal.has(file.id);
                        return (
                          <motion.div
                            key={file.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => toggleMediaSelection(file.id)}
                            className={`relative cursor-pointer rounded-lg overflow-hidden aspect-square group transition-all ${
                              isSelected ? 'ring-2 ring-primary' : ''
                            }`}
                          >
                            <Image
                              src={file.url}
                              alt={file.filename}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover group-hover:brightness-75 transition-all duration-200"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-background" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="font-paragraph text-xs text-background truncate">{file.filename}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <FolderOpen className="h-12 w-12 text-secondary/30 mx-auto mb-4" />
                        <p className="font-paragraph text-secondary/70">No media files found</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-secondary/10 px-6 py-4 flex items-center justify-between bg-secondary/5">
                <p className="font-paragraph text-sm text-secondary/70">
                  {selectedInModal.size} item{selectedInModal.size !== 1 ? 's' : ''} selected
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="border-secondary/20 text-secondary hover:bg-secondary/5 font-paragraph text-sm py-2 px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmSelection}
                    disabled={selectedInModal.size === 0}
                    className="bg-primary hover:bg-primary/90 text-background font-paragraph text-sm py-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Select
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Media Grid */}
      {selectedMedia.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-6"
        >
          <div>
            <h3 className="font-heading text-xl text-secondary mb-6">
              Selected Media ({selectedMedia.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedMedia.map((media) => (
                <motion.div
                  key={media.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group"
                >
                  <div className="relative overflow-hidden aspect-square bg-secondary/10 rounded-lg">
                    <Image
                      src={media.url}
                      alt={media.filename}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => removeMedia(media.id)}
                      className="absolute top-3 right-3 bg-accent-red hover:bg-accent-red/90 text-background p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <p className="font-paragraph text-xs text-secondary/70 truncate">
                      {media.filename}
                    </p>
                    {media.width && media.height && (
                      <p className="font-paragraph text-xs text-secondary/50">
                        {media.width} × {media.height}px
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Display URLs and File IDs for reference */}
          <div className="p-6 bg-background rounded-lg border border-secondary/10">
            <h4 className="font-heading text-sm text-secondary mb-4">Media Details:</h4>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {selectedMedia.map((media) => (
                <div key={media.id} className="space-y-2 pb-4 border-b border-secondary/10 last:border-b-0">
                  <div>
                    <p className="font-paragraph text-xs text-secondary/60 mb-1">File Name:</p>
                    <p className="font-paragraph text-xs text-secondary break-all">
                      {media.filename}
                    </p>
                  </div>
                  <div>
                    <p className="font-paragraph text-xs text-secondary/60 mb-1">File ID:</p>
                    <code className="font-mono text-xs bg-secondary/5 px-2 py-1 rounded text-secondary break-all">
                      {media.id}
                    </code>
                  </div>
                  <div>
                    <p className="font-paragraph text-xs text-secondary/60 mb-1">URL:</p>
                    <code className="font-mono text-xs bg-secondary/5 px-2 py-1 rounded text-secondary break-all">
                      {media.url}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {selectedMedia.length === 0 && !isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-secondary/50 mt-8"
        >
          <p className="font-paragraph">No media selected yet. Click the button above to open the media manager.</p>
        </motion.div>
      )}
    </div>
  );
}
