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
import { trackletObjectsAtom } from '@/demo/atoms';
import { Modal } from 'react-daisyui';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import useVideo from '@/common/components/video/editor/useVideo';
import { Button } from 'react-daisyui';
import { Download } from '@carbon/icons-react';

type Props = {
    open: boolean;
    onClose: () => void;
};

export default function ExportDialog({ open, onClose }: Props) {
    const tracklets = useAtomValue(trackletObjectsAtom);
    const video = useVideo();
    const modalRef = useRef<HTMLDialogElement>(null);
    const [widthInMeters, setWidthInMeters] = useState<string>('25'); // Default 25m (standard pool width)
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const modal = modalRef.current;
        if (modal == null) {
            return;
        }

        if (open && !modal.open) {
            modal.showModal();
        } else if (!open && modal.open) {
            modal.close();
        }
    }, [open]);

    useEffect(() => {
        const modal = modalRef.current;
        if (modal == null) {
            return;
        }

        modal.addEventListener('close', onClose);
        return () => modal.removeEventListener('close', onClose);
    }, [onClose]);

    const handleExport = async () => {
        if (!video) return;
        setIsExporting(true);

        try {
            const timestamps = await video.getTimestamps();
            const videoWidth = video.width;
            const realWidth = parseFloat(widthInMeters);
            const scale = realWidth / videoWidth; // meters per pixel

            const headers = [
                'frame_index',
                'timestamp',
                'object_id',
                'label',
                'x_pixel',
                'y_pixel',
                'x_meter',
                'y_meter',
            ];
            const rows: string[] = [headers.join(',')];

            tracklets.forEach(tracklet => {
                tracklet.masks.forEach((mask, frameIndex) => {
                    if (mask && !mask.isEmpty) {

                        const bounds = mask.bounds;
                        const minX = bounds[0][0];
                        const minY = bounds[0][1];
                        const maxX = bounds[1][0];
                        const maxY = bounds[1][1];

                        const width = maxX - minX;
                        const height = maxY - minY;

                        const centerX = minX + width / 2;
                        const centerY = minY + height / 2;

                        const xMeter = centerX * scale;
                        const yMeter = centerY * scale;

                        const timestamp = timestamps[frameIndex] ?? -1;
                        const label = tracklet.label ?? `Object ${tracklet.id + 1}`;

                        rows.push(
                            [
                                frameIndex,
                                timestamp,
                                tracklet.id,
                                `"${label}"`,
                                centerX.toFixed(2),
                                centerY.toFixed(2),
                                xMeter.toFixed(4),
                                yMeter.toFixed(4),
                            ].join(','),
                        );
                    }
                });
            });

            const csvContent = 'data:text/csv;charset=utf-8,' + rows.join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', 'tracking_data.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            onClose();
        } catch (e) {
            console.error('Export failed', e);
            alert('Export failed. See console for details.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Modal
            ref={modalRef}
            className="bg-gray-800 text-white p-6 rounded-xl"
        >
            <Modal.Header className="font-bold text-lg mb-4">
                Export Tracking Data
            </Modal.Header>
            <Modal.Body>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Field of View Width (Meters)
                        </label>
                        <div className="text-xs text-gray-400 mb-2">
                            Enter the estimated real-world width covered by the video frame to calulcate coordinates in meters.
                        </div>
                        <input
                            type="number"
                            value={widthInMeters}
                            onChange={e => setWidthInMeters(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g. 25"
                        />
                    </div>
                </div>
            </Modal.Body>
            <Modal.Actions className="mt-6 flex justify-end gap-2">
                <Button onClick={onClose} className="bg-transparent text-gray-300 hover:text-white border-none">
                    Cancel
                </Button>
                <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-none gap-2"
                >
                    {isExporting ? 'Exporting...' : <><Download /> Export CSV</>}
                </Button>
            </Modal.Actions>
        </Modal>
    );
}
