import { Document, Page } from 'react-pdf';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Range, defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import { PDFDocumentProxy, PageViewport } from 'pdfjs-dist';
import '@ungap/with-resolvers';

import './myPdfViewer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { MyPdfControls } from './MyPdfControls';


export type MyPdfViewerProps = {
    fileUrl: string|Uint8Array,
    httpHeaders: {[k: string]: string},
    defaultScale?: number,
    documentLoadedCallback?: () => void,
}

const maxWidth = 1024;
const heightEstimate = 512; // should be large enough that it doesn't think all pages of a pdf fit on the screen at once.

type ScaleState = {
    scale: number;
    targetOffset: number|null;
}
type ScaleAction = { type: 'zoom', factor: number, targetOffset: number } | { type: 'clearOffset' }

export const MyPdfViewer = (props: MyPdfViewerProps) => {
    const [pageCount, setPageCount] = useState<number>();
    const containerRef = useRef<HTMLDivElement|null>(null);
    const [containerWidth, setContainerWidth] = useState<number>(maxWidth);
    const [viewports, setViewports] = useState<PageViewport[]>([]);
    const visibleRangeRef = useRef<Range|null>(null);

    const scaleReducer = (state: ScaleState, action: ScaleAction): ScaleState => {
        if (action.type === 'zoom') {
            return { scale: state.scale * action.factor, targetOffset: action.targetOffset }
        } else { // if (action.type === 'clearOffset') {
            return { scale: state.scale, targetOffset: null }
        }
    }
    const [scaleState, dispatchScale] = useReducer(scaleReducer, {scale: props.defaultScale ?? 1, targetOffset: null})

    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.clientWidth)
        }
    },[containerRef.current]);

    const handleDocumentLoaded = (document: PDFDocumentProxy) => {
        setPageCount(document.numPages);
        getMeasurementsFromDocument(document);

        if (props.documentLoadedCallback) {
            props.documentLoadedCallback();
        }
    }

    const options = useMemo(() => ({httpHeaders: props.httpHeaders}), [props.fileUrl]); // updating will cause a re-download and re-render of the pdf

    const virtualizer = useVirtualizer({
        count: pageCount ?? 0,
        getScrollElement: () => containerRef.current,
        estimateSize: (i) => {
            if (viewports.length === 0) {
                return heightEstimate;
            }
            const ratio = Math.min(containerWidth, maxWidth) / viewports[i].width * scaleState.scale;
            return Math.round(viewports[i].height * ratio);
        },
        overscan: 2,
        gap: 16,
        paddingStart: 16,
        paddingEnd: 16,
        rangeExtractor: useCallback((range: Range) => {
            visibleRangeRef.current = range;
            return defaultRangeExtractor(range);
        }, []),
    })

    const getMeasurementsFromDocument = (document: PDFDocumentProxy) => {
        console.log('getting measurements')
        const range = [...Array(document.numPages).keys()]; // [0, 1, 2, 3, ...]
        const promises = range.map((i) => document.getPage(i + 1).then((page) => page.getViewport({ scale: 1 })));
        Promise.all(promises).then((resolvedViewports) => setViewports(resolvedViewports))
    }

    useEffect(() => {
        if (viewports.length > 0) {
            virtualizer.measure();
        }
    }, [scaleState.scale, viewports])

    const offset = virtualizer.getVirtualItems()[0]?.start;


    useEffect(() => {
        if (scaleState.targetOffset) {
            console.log(`After: ${scaleState.targetOffset} / ${virtualizer.getTotalSize()} = ${scaleState.targetOffset / virtualizer.getTotalSize()}`)
            virtualizer.scrollToOffset(scaleState.targetOffset);
            dispatchScale({ type: 'clearOffset'});
        }
    }, [virtualizer.getTotalSize()])

    const zoomByFactor = (factor: number) => {
        // can't move this calculation into the reducer because it can't reference virtualizer
        const gaps = 16 * (visibleRangeRef.current?.startIndex ?? 0);
        const currentOffset = virtualizer.scrollOffset ?? 0;
        const targetOffset = (currentOffset - gaps) * factor + gaps;
        dispatchScale({type: 'zoom', factor, targetOffset})
        console.log(`Before: ${virtualizer.scrollOffset} / ${virtualizer.getTotalSize()} = ${currentOffset / virtualizer.getTotalSize()}`);
    };

    return <div className="pdf-container" ref={containerRef}>
        <div className="controls-container">
            <MyPdfControls
                currentPageIndex={visibleRangeRef.current?.startIndex}
                pageCount={pageCount}
                navToPageIndex={(i) => virtualizer.scrollToIndex(i)}
                zoomByFactor={zoomByFactor}
                />
        </div>
        <Document file={props.fileUrl} options={options} onLoadSuccess={handleDocumentLoaded}>
            <div style={{height: virtualizer.getTotalSize() + "px"}}>
                <div style={{height: offset + 'px'}}></div>
                {virtualizer.getVirtualItems().map((virtualPage) =>
                    <div className='page-wrapper' style={{height: virtualPage.size + 'px'}} key={virtualPage.key}>
                        <Page
                            pageNumber={virtualPage.index + 1}
                            height={virtualPage.size}
                            />
                    </div>
                )}
            </div>
        </Document>
    </div>;
}