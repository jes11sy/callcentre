"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
  placeholder?: string;
  value?: File | null;
}

export function FileUpload({
  onFileSelect,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
  maxSize = 5 * 1024 * 1024, // 5MB
  className,
  placeholder = "Перетащите файл сюда или нажмите для выбора",
  value,
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        onFileSelect(file);
        
        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            setPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const removeFile = () => {
    onFileSelect(null);
    setPreview(null);
  };

  // Show preview if file is selected
  if (value || preview) {
    return (
      <div className="relative">
        <div className="flex items-center space-x-3 p-4 border border-border rounded-lg bg-muted/50">
          <FileImage className="h-8 w-8 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {value?.name || 'Выбранный файл'}
            </p>
            <p className="text-xs text-muted-foreground">
              {value ? `${(value.size / 1024 / 1024).toFixed(2)} MB` : ''}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeFile}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {preview && (
          <div className="mt-3">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full h-32 object-cover rounded-lg border border-border"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors",
        "hover:border-primary/50 hover:bg-muted/50",
        isDragActive && "border-primary bg-primary/5",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center space-y-2">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? "Отпустите файл здесь" : placeholder}
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, JPEG или WEBP (макс. {maxSize / 1024 / 1024}MB)
          </p>
        </div>
      </div>
      
      {fileRejections.length > 0 && (
        <div className="mt-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="text-xs text-destructive">
              {errors.map((error) => (
                <p key={error.code}>
                  {error.code === 'file-too-large' && 'Файл слишком большой'}
                  {error.code === 'file-invalid-type' && 'Неподдерживаемый тип файла'}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
