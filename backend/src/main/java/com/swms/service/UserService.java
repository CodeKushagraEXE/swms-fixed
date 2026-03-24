package com.swms.service;
import com.swms.dto.Dtos;
import com.swms.model.User;
import com.swms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {
    @Autowired private UserRepository userRepo;

    @Transactional(readOnly = true)
    public List<Dtos.UserSummary> getAllUsers() {
        return userRepo.findAll().stream().map(this::toSummary).collect(Collectors.toList());
    }

    public Dtos.UserSummary toSummary(User u) {
        var s = new Dtos.UserSummary();
        s.setId(u.getId()); s.setName(u.getName()); s.setEmail(u.getEmail());
        s.setRole(u.getRole().name()); return s;
    }
}
