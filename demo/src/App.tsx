import React, { useState } from 'react';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'
import { MyPdfViewer, pdfjs } from '@contentgrid/virtual-pdf-reader';

import './demo.css'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const files = ['sample.pdf', 'frankenstein.pdf']

export const App = () => {
    const [currentFile, setCurrentFile] = useState<string>('sample.pdf')

    return (
        <>
            <div style={{textAlign: 'center'}}>
                <select
                    onChange={(e) => setCurrentFile(e.target.value)}>
                    {files.map((f) => <option value={f}>{f}</option>)}
                </select>
            </div>
            <div className='demo-wrapper'>
                <MyPdfViewer fileUrl={'/' + currentFile} httpHeaders={{}} />
            </div>
        </>
    );
}