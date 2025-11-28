import React, { useRef } from 'react';

interface FileUploadProps {
  label: string;
  onFileSelect: (content: string, fileName: string) => void;
  accept?: string;
  colorClass?: string;
  iconColor?: string;
  fileName?: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  onFileSelect, 
  accept = ".csv", 
  colorClass = "border-pink-300 bg-white text-pink-700",
  iconColor = "text-pink-400",
  fileName
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onFileSelect(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-gray-600 mb-3 ml-1 font-cute">{label}</label>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 ${colorClass}`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept={accept}
          className="hidden" 
        />
        <div className={`mb-3 p-3 rounded-full bg-opacity-10 bg-current`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-sm font-bold font-cute tracking-wide">
          {fileName ? (
            <span className="flex items-center gap-2">
              <span className="bg-green-100 text-green-600 p-1 rounded-full">✓</span>
              {fileName}
            </span>
          ) : "คลิกเพื่อเลือกไฟล์ CSV"}
        </span>
      </div>
    </div>
  );
};