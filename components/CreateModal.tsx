'use client';

import React, { useState, useRef } from 'react';
import { X, Image, Film, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthUser } from '../types';
import { postService } from '../services/dataService';

interface CreateModalProps {
  onClose: () => void;
  currentUser?: AuthUser | null;
  onPostCreated?: () => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ onClose, currentUser, onPostCreated }) => {
  const [step, setStep] = useState<'select' | 'edit' | 'caption'>('select');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileObj(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile(event.target?.result as string);
        setStep('edit');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBack = () => {
    if (step === 'edit') {
      setSelectedFile(null);
      setSelectedFileObj(null);
      setStep('select');
    } else if (step === 'caption') {
      setStep('edit');
    }
  };

  const handleNext = async () => {
    if (step === 'edit') {
      setStep('caption');
    } else if (step === 'caption') {
      if (!currentUser || !selectedFile) {
        alert('Please select an image and make sure you are logged in.');
        return;
      }

      setIsSubmitting(true);
      try {
        // Use base64 data URL as imageUrl for now
        // In production, you would upload the file to a server first
        const imageUrl = selectedFile;

        const result = await postService.createPost({
          userId: currentUser.id,
          imageUrl,
          caption: caption.trim(),
          location: location.trim() || undefined,
        });

        if (result.success) {
          // Call the callback to refresh feeds
          if (onPostCreated) {
            onPostCreated();
          }
          onClose();
        } else {
          alert(`Failed to create post: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="create-modal-overlay" onClick={onClose}>
      <button className="modal-close-btn" aria-label="Close modal">
        <X size={32} />
      </button>

      <div className="create-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="create-modal__header">
          {step !== 'select' && (
            <button className="create-modal__nav-btn" onClick={handleBack} aria-label="Go back">
              <ChevronLeft size={24} />
            </button>
          )}
          <h2 className="create-modal__title">
            {step === 'select' && 'Create new post'}
            {step === 'edit' && 'Edit'}
            {step === 'caption' && 'Create new post'}
          </h2>
          {step !== 'select' && (
            <button 
              className="create-modal__next-btn" 
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sharing...' : step === 'caption' ? 'Share' : 'Next'}
            </button>
          )}
        </header>

        {/* Content */}
        <div className="create-modal__content">
          {step === 'select' && (
            <div className="create-modal__upload">
              <div className="create-modal__upload-icons">
                <Image size={64} strokeWidth={1} />
                <Film size={64} strokeWidth={1} />
              </div>
              <p className="create-modal__upload-text">Drag photos and videos here</p>
              <button
                className="create-modal__upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Select from computer
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {step === 'edit' && selectedFile && (
            <div className="create-modal__preview">
              <img src={selectedFile} alt="Preview" className="create-modal__preview-img" />
            </div>
          )}

          {step === 'caption' && selectedFile && (
            <div className="create-modal__caption-step">
              <div className="create-modal__caption-preview">
                <img src={selectedFile} alt="Preview" className="create-modal__preview-img" />
              </div>
              <div className="create-modal__caption-form">
                <div className="create-modal__user-row">
                  <img
                    src={currentUser?.avatar || 'https://picsum.photos/seed/meta/150/150'}
                    alt="Your avatar"
                    className="create-modal__user-avatar"
                  />
                  <span className="create-modal__user-name">{currentUser?.username || 'user'}</span>
                </div>
                <textarea
                  className="create-modal__textarea"
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                  disabled={isSubmitting}
                />
                <div className="create-modal__char-count">{caption.length}/2,200</div>
                <div className="create-modal__location-row">
                  <input
                    type="text"
                    placeholder="Add location"
                    className="create-modal__location-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <MapPin size={16} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateModal;
