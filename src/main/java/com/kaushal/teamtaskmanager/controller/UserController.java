package com.kaushal.teamtaskmanager.controller;

import com.kaushal.teamtaskmanager.dto.UserResponse;
import com.kaushal.teamtaskmanager.service.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
	private final UserService userService;

	@GetMapping
	public List<UserResponse> all() {
		return userService.allUsers();
	}
}
