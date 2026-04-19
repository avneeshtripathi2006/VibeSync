package com.vibesync.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    // Find a specific friend request between two users
    @Query("SELECT fr FROM FriendRequest fr WHERE " +
           "(fr.sender.id = :senderId AND fr.receiver.id = :receiverId AND fr.status = 'PENDING') OR " +
           "(fr.sender.id = :receiverId AND fr.receiver.id = :senderId AND fr.status = 'ACCEPTED')")
    Optional<FriendRequest> findFriendshipStatus(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);

    // Get all pending friend requests for a user (received)
    List<FriendRequest> findByReceiverIdAndStatus(Long receiverId, FriendRequest.FriendRequestStatus status);

    // Get all pending friend requests sent by a user
    List<FriendRequest> findBySenderIdAndStatus(Long senderId, FriendRequest.FriendRequestStatus status);

    // Get all friends (accepted requests) for a user
    @Query("SELECT fr FROM FriendRequest fr WHERE " +
           "(fr.sender.id = :userId OR fr.receiver.id = :userId) AND fr.status = 'ACCEPTED'")
    List<FriendRequest> findAllFriends(@Param("userId") Long userId);

    // Count accepted connections for a user (VIBES - all accepted connections)
    @Query("SELECT COUNT(fr) FROM FriendRequest fr WHERE " +
           "(fr.sender.id = :userId OR fr.receiver.id = :userId) AND fr.status = 'ACCEPTED'")
    long countAcceptedConnections(@Param("userId") Long userId);

    // Check if there's already a pending request or accepted connection
    @Query("SELECT CASE WHEN (COUNT(fr) > 0) THEN true ELSE false END FROM FriendRequest fr WHERE " +
           "((fr.sender.id = :senderId AND fr.receiver.id = :receiverId) OR " +
           "(fr.sender.id = :receiverId AND fr.receiver.id = :senderId)) AND fr.status != 'REJECTED'")
    boolean existsActiveFriendRequest(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);

    // Get the relationship status between two users
    @Query("SELECT fr FROM FriendRequest fr WHERE " +
           "((fr.sender.id = :userId1 AND fr.receiver.id = :userId2) OR " +
           "(fr.sender.id = :userId2 AND fr.receiver.id = :userId1))")
    Optional<FriendRequest> findBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
