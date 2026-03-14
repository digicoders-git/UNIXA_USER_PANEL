import api from "./api";

export const getConversations = async () => {
    const response = await api.get("/sms/conversations");
    return response.data;
};

export const getHistory = async (phoneNumber) => {
    const response = await api.get(`/sms/history/${encodeURIComponent(phoneNumber)}`);
    return response.data;
};

export const replyToSMS = async (data) => {
    const response = await api.post("/sms/reply", data);
    return response.data;
};

export const simulateIncoming = async (data) => {
    const response = await api.post("/sms/simulate-incoming", data);
    return response.data;
};
