package com.edutech.supply_of_goods_management.service;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.edutech.supply_of_goods_management.entity.Feedback;
import com.edutech.supply_of_goods_management.entity.Order;
import com.edutech.supply_of_goods_management.entity.User;
import com.edutech.supply_of_goods_management.repository.FeedbackRepository;
import com.edutech.supply_of_goods_management.repository.OrderRepository;
import com.edutech.supply_of_goods_management.repository.UserRepository;
@Service
public class FeedbackService {

    @Autowired private FeedbackRepository repo;
    @Autowired private OrderRepository orderRepo;
    @Autowired private UserRepository userRepo;

    public Feedback provideFeedback(Long orderId, Long userId, Feedback fb) {

        fb.setOrder(orderRepo.findById(orderId).orElseThrow());
        fb.setUser(userRepo.findById(userId).orElseThrow());
        fb.setTimestamp(new Date());

        return repo.save(fb);
    }
    public List<Feedback> getFeedbacksForWholesaler(Long wholesalerId) {
    return repo.findFeedbacksForWholesaler(wholesalerId);
}
}