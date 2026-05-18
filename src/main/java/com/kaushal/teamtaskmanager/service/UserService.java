package com.kaushal.teamtaskmanager.service;

import com.kaushal.teamtaskmanager.dto.UserResponse;
import com.kaushal.teamtaskmanager.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
	private final UserRepository userRepository;

	@PreAuthorize("hasRole('ADMIN')")
	public List<UserResponse> allUsers() {
		return userRepository.findAll().stream().map(UserResponse::from).toList();
	}
}
