package com.swms.controller;
import com.swms.dto.Dtos;
import com.swms.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users")
public class UserController {
    @Autowired private UserService userService;

    @GetMapping
    public ResponseEntity<List<Dtos.UserSummary>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}
