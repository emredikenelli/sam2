/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import ObjectActions from '@/common/components/annotations/ObjectActions';
import ObjectPlaceholder from '@/common/components/annotations/ObjectPlaceholder';
import ObjectThumbnail from '@/common/components/annotations/ObjectThumbnail';
import ToolbarObjectContainer from '@/common/components/annotations/ToolbarObjectContainer';
import useVideo from '@/common/components/video/editor/useVideo';
import { BaseTracklet } from '@/common/tracker/Tracker';
import emptyFunction from '@/common/utils/emptyFunction';
import { activeTrackletObjectIdAtom } from '@/demo/atoms';
import { useSetAtom } from 'jotai';

type Props = {
  label: string;
  tracklet: BaseTracklet;
  isActive: boolean;
  isMobile?: boolean;
  onClick?: () => void;
  onThumbnailClick?: () => void;
};

import { useState, useRef, useEffect } from 'react';
import { Edit } from '@carbon/icons-react';

export default function ToolbarObject({
  label,
  tracklet,
  isActive,
  isMobile = false,
  onClick,
  onThumbnailClick = emptyFunction,
}: Props) {
  const video = useVideo();
  const setActiveTrackletId = useSetAtom(activeTrackletObjectIdAtom);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedLabel(label);
  }, [label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  async function handleCancelNewObject() {
    try {
      await video?.deleteTracklet(tracklet.id);
    } catch (error) {
      reportError(error);
    } finally {
      setActiveTrackletId(null);
    }
  }

  const handleRename = async () => {
    if (editedLabel !== label) {
      await video?.renameTracklet(tracklet.id, editedLabel);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditedLabel(label);
      setIsEditing(false);
    }
  };

  if (!tracklet.isInitialized) {
    return (
      <ToolbarObjectContainer
        alignItems="center"
        isActive={isActive}
        title="New object"
        subtitle="No object is currently selected. Click an object in the video."
        thumbnail={<ObjectPlaceholder showPlus={false} />}
        isMobile={isMobile}
        onClick={onClick}
        onCancel={handleCancelNewObject}
      />
    );
  }

  const titleContent = isEditing ? (
    <input
      ref={inputRef}
      value={editedLabel}
      onChange={(e) => setEditedLabel(e.target.value)}
      onBlur={handleRename}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      className="bg-gray-700 text-white px-1 rounded w-full"
    />
  ) : (
    <div className="flex items-center gap-2 group">
      <span>{label}</span>
      <Edit
        size={16}
        className="opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-white"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      />
    </div>
  );

  return (
    <ToolbarObjectContainer
      isActive={isActive}
      onClick={onClick}
      title={titleContent}
      subtitle=""
      thumbnail={
        <ObjectThumbnail
          thumbnail={tracklet.thumbnail}
          color={tracklet.color}
          onClick={onThumbnailClick}
        />
      }
      isMobile={isMobile}>
      <ObjectActions objectId={tracklet.id} active={isActive} />
    </ToolbarObjectContainer>
  );
}
