import React from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { FolderSearch } from 'lucide-react'
import { open } from '@tauri-apps/plugin-dialog'
import { useErrorStore } from './store'
import { useTranslation } from 'react-i18next'

interface CustomPathProps {
  value: string;
  onChange: (value: string) => void;
}

const CustomPath: React.FC<CustomPathProps> = ({ value, onChange }) => {
  const { t } = useTranslation()

  const setCurrentBackendError = useErrorStore((state) => state.setCurrentBackendError)

  const handleOpenDialog = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === 'string') {
        onChange(selected);
      }
    } catch (err) {
      setCurrentBackendError(err)
      console.error("Failed to open directory dialog", err);
    }
  }

  return (
    <div className="flex w-full items-center space-x-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("scan.placeholders.customPath")}
      />
      <Button variant="outline" size="icon" onClick={handleOpenDialog} aria-label={t("scan.actions.browseFolder")}>
        <FolderSearch className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default CustomPath
