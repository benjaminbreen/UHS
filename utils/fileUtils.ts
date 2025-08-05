/**
 * utils/fileUtils.ts - Utilities for handling file operations like saving and loading.
 */

export function saveJsonToFile(data: any, filename: string): void {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to save JSON to file:", error);
        alert("Error: Could not save file.");
    }
}
