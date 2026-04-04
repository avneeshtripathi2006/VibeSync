import axios from "axios";

/** REST fallback when STOMP is unavailable (Vite + legacy stompjs was unreliable). */
export async function sendChatViaRest(getApiBase, token, receiverId, content) {
  const { data } = await axios.post(
    `${getApiBase()}/api/chat/send`,
    { receiverId, content },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (data == null) throw new Error("Empty response from chat send");
  return data;
}
