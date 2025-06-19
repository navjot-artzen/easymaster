
import { AxiosRequestHeaders } from "axios";
import { fetchApi } from "../axios";
import { queueDelayTime } from "@/app/utils/config/constant";
import { QstashProps, Error } from "@/types/interfaces";
import { Client } from "@upstash/qstash";
import "isomorphic-fetch";
const { QSTASH_URL, QSTASH_TOKEN } = process.env;

const upstashClient = new Client({
    token: QSTASH_TOKEN,
});

interface headersProps extends AxiosRequestHeaders {
    Authorization: string; // Bearer token
    "Content-type": string;
    "Upstash-Callback"?: string;
    "Upstash-Cron"?: string;
    "Upstash-Delay"?: string;
    "Upstash-Retries"?: string;
    "Upstash-Not-Before"?: string;
}

export const handleAPIStashQueue = async ({
    DESTINATION_URL,
    payload,
}: QstashProps) => {
    try {
        const qstashResponse = await fetchApi({
            url: `${QSTASH_URL}/v2/publish/${DESTINATION_URL}`,
            method: "POST",
            headers: {
                Authorization: `Bearer ${QSTASH_TOKEN}`,
                "Content-type": "application/json",
                "Upstash-Delay": queueDelayTime,
            } as headersProps,
            payload,
        });
        console.log(`Qstash queue response: ${JSON.stringify(qstashResponse)}`);
    } catch (error: Error | any) {
        console.error(`Error while queue Message API: ${error?.message || error}`);
        return null;
    }
};

// export async function scheduleDailyInventorySync({
//     DESTINATION_URL
// }: QstashProps) {
//     await upstashClient.schedules.create({
//         destination: DESTINATION_URL,
//         cron: "*/1 * * * *",
//     });
// }

// scheduleDailyInventorySync("https://spiritual-rover-version-miss.trycloudflare.com/csv-fetch")