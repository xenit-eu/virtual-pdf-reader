import { useState } from "react";

export type MyPdfControlsProps = {
    pageCount?: number,
    currentPageIndex?: number,
    navToPageIndex: (i: number) => void,
    zoomByFactor: (factor: number) => void,
}

export const MyPdfControls = ({pageCount, currentPageIndex, navToPageIndex, zoomByFactor}: MyPdfControlsProps) => {
    const [pageEntry, setPageEntry] = useState<string|null>(null);

    const handlePageSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && pageEntry) {
            const target = Number(pageEntry) - 1;
            setPageEntry(null);
            navToPageIndex(target);
        }
    }

    if (pageCount === undefined || currentPageIndex === undefined) {
        return null;
    }

    return  (
        <>
            <span>
                <input type='text'
                    size={3}
                    value={pageEntry ?? currentPageIndex + 1}
                    onChange={(e) => setPageEntry(e.target.value)}
                    onKeyDown={handlePageSubmit}
                />
                /{pageCount}
            </span>
            <button onClick={() => zoomByFactor(1.1)}>(+)</button>
            <button onClick={() => zoomByFactor(1 / 1.1)}>(-)</button>
        </>
    );

}