
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

type Props = {
  userId: string;
  currentAvatarUrl?: string;
  onAvatarUploaded: (url: string) => void;
};

const UserAvatar: React.FC<Props> = ({ userId, currentAvatarUrl = "", onAvatarUploaded }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // Use avatars/userId.extension as storage path
    const ext = file.name.split('.').pop();
    const filePath = `avatars/${userId}_${Date.now()}.${ext}`;
    let { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    // Get public URL
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    onAvatarUploaded(publicUrl);
    setUploading(false);
    toast({ title: "Avatar uploaded" });
  };

  return (
    <div className="flex gap-2 items-center">
      <Avatar>
        <AvatarImage src={currentAvatarUrl} alt="avatar" />
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
      <Input type="file" accept="image/*" disabled={uploading} onChange={handleUpload} className="w-auto" />
      {uploading && <span>Uploading...</span>}
    </div>
  );
};

export default UserAvatar;

