package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:5173")
public class ChatController {

    @Autowired
    private MessageRepository messageRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/send")
    public Message sendMessage(@RequestHeader("Authorization") String token, @RequestBody Message msg) {
        if (token == null || !token.startsWith("Bearer "))
            return null;

        String email = jwtUtil.extractEmail(token.substring(7));
        User sender = userRepository.findByEmail(email);

        msg.setSenderId(sender.getId());
        return messageRepository.save(msg);
    }

    @GetMapping("/history/{receiverId}")
    public List<Message> getHistory(@RequestHeader("Authorization") String token, @PathVariable Long receiverId) {
        if (token == null || !token.startsWith("Bearer "))
            return null;

        String email = jwtUtil.extractEmail(token.substring(7));
        User sender = userRepository.findByEmail(email);

        return messageRepository.findChatHistory(sender.getId(), receiverId);
    }

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void processMessage(@Payload Message chatMessage) {
        // 1. Save to Database (just like before)
        Message savedMsg = messageRepository.save(chatMessage);

        // 2. Push to the specific "room" for this receiver
        // The receiver will be listening to /topic/messages/{theirId}
        messagingTemplate.convertAndSend("/topic/messages/" + savedMsg.getReceiverId(), savedMsg);

        // 3. Optional: Push back to the sender so their UI updates too
        messagingTemplate.convertAndSend("/topic/messages/" + savedMsg.getSenderId(), savedMsg);
    }

    @GetMapping("/count/{receiverId}")
    public Long getCount(@RequestHeader("Authorization") String token, @PathVariable Long receiverId) {
        if (token == null || !token.startsWith("Bearer "))
            return 0L;
        String email = jwtUtil.extractEmail(token.substring(7));
        User sender = userRepository.findByEmail(email);
        return messageRepository.countMessagesBetween(sender.getId(), receiverId);
    }
}