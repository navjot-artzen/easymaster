export const getCsvFiles = async (shop: string) => {
    try {
        const response = await fetch(`/api/upload-csv?shop=${shop}`, {
            method: "GET",
        });

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            throw new Error(data.error || "Failed to Get CSV files");
        }

        return data;
    } catch (error) {
        console.error("Update CSVFile error:", error);
        throw error;
    }
}

export const updateCsvFile = async (csvFileId: string, action: string) => {
    try {
        const response = await fetch(`/api/upload-csv/${csvFileId}`, {
            method: "PUT",
            body: JSON.stringify({ action })
        });

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            throw new Error(data.error || "Failed to Update file");
        }

        return data;
    } catch (error) {
        console.error("Update CSVFile error:", error);
        throw error;
    }
}


export async function deleteCSVFile(id: string) {
    try {
        const response = await fetch(`/api/upload-csv/${id}`, {
            method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            throw new Error(data.error || "Failed to delete file");
        }

        return data;
    } catch (error) {
        console.error("deleteCSVFile error:", error);
        throw error;
    }
}
