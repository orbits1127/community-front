'use client';

import React, { useState, useRef } from 'react';
import { X, Image, Film, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface CreateModalProps {
  onClose: () => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<'select' | 'edit' | 'caption'>('select');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      setStep('select');
    } else if (step === 'caption') {
      setStep('edit');
    }
  };

  const handleNext = () => {
    if (step === 'edit') {
      setStep('caption');
    } else if (step === 'caption') {
      // Here you would submit the post
      alert('Post created! (Demo)');
      onClose();
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
            <button className="create-modal__next-btn" onClick={handleNext}>
              {step === 'caption' ? 'Share' : 'Next'}
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
                    src="https://picsum.photos/seed/meta/150/150"
                    alt="Your avatar"
                    className="create-modal__user-avatar"
                  />
                  <span className="create-modal__user-name">modern_developer</span>
                </div>
                <textarea
                  className="create-modal__textarea"
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                />
                <div className="create-modal__char-count">{caption.length}/2,200</div>
                <div className="create-modal__location-row">
                  <input
                    type="text"
                    placeholder="Add location"
                    className="create-modal__location-input"
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
