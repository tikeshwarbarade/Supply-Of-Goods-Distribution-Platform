package com.edutech.supply_of_goods_management.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.edutech.supply_of_goods_management.entity.Feedback;

import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    @Query("SELECT f FROM Feedback f WHERE f.order.sellerWholesalerId = :wholesalerId")
List<Feedback> findFeedbacksForWholesaler(@Param("wholesalerId") Long wholesalerId);
}