package com.vibesync.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    // This finds all messages where User A is sender and User B is receiver, OR
    // vice versa.
    @Query("SELECT m FROM Message m WHERE " +
            "(m.senderId = :u1 AND m.receiverId = :u2) OR " +
            "(m.senderId = :u2 AND m.receiverId = :u1) " +
            "ORDER BY m.timestamp ASC")
    List<Message> findChatHistory(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query("SELECT m FROM Message m WHERE " +
            "(m.senderId = :u1 AND m.receiverId = :u2) OR " +
            "(m.senderId = :u2 AND m.receiverId = :u1) " +
            "ORDER BY m.timestamp DESC")
    List<Message> findChatHistoryPage(@Param("u1") Long u1, @Param("u2") Long u2, Pageable pageable);

    @Query("SELECT COUNT(m) FROM Message m WHERE " +
            "(m.senderId = :u1 AND m.receiverId = :u2) OR " +
            "(m.senderId = :u2 AND m.receiverId = :u1)")
    Long countMessagesBetween(@Param("u1") Long u1, @Param("u2") Long u2);

    // Find unread messages from a specific sender to receiver
    List<Message> findBySenderIdAndReceiverIdAndIsReadFalse(Long senderId, Long receiverId);

    // Count unread messages from a specific sender to receiver
    long countBySenderIdAndReceiverIdAndIsReadFalse(Long senderId, Long receiverId);

        // Count all unread messages for a receiver
        long countByReceiverIdAndIsReadFalse(Long receiverId);

        // senderId -> unreadCount for a receiver
        @Query("SELECT m.senderId, COUNT(m) FROM Message m WHERE m.receiverId = :receiverId AND m.isRead = false GROUP BY m.senderId")
        List<Object[]> findUnreadCountsGroupedBySender(@Param("receiverId") Long receiverId);

        // partnerId -> latest message timestamp for a user
        @Query("SELECT CASE WHEN m.senderId = :userId THEN m.receiverId ELSE m.senderId END, MAX(m.timestamp) " +
                        "FROM Message m " +
                        "WHERE m.senderId = :userId OR m.receiverId = :userId " +
                        "GROUP BY CASE WHEN m.senderId = :userId THEN m.receiverId ELSE m.senderId END")
        List<Object[]> findLatestMessageTimestampByPartner(@Param("userId") Long userId);
}