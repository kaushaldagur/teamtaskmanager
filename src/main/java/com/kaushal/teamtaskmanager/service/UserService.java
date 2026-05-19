package com.kaushal.teamtaskmanager.service;

import com.kaushal.teamtaskmanager.dto.AuthDtos.SignupRequest;
import com.kaushal.teamtaskmanager.dto.UserResponse;
import com.kaushal.teamtaskmanager.entity.Role;
import com.kaushal.teamtaskmanager.entity.User;
import com.kaushal.teamtaskmanager.exception.ApiException;
import com.kaushal.teamtaskmanager.repository.ProjectRepository;
import com.kaushal.teamtaskmanager.repository.TaskRepository;
import com.kaushal.teamtaskmanager.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
	private final UserRepository userRepository;
	private final ProjectRepository projectRepository;
	private final TaskRepository taskRepository;
	private final CurrentUserService currentUserService;
	private final PasswordEncoder passwordEncoder;

	@PreAuthorize("hasRole('ADMIN')")
	public List<UserResponse> allUsers() {
		return userRepository.findAll().stream().map(UserResponse::from).toList();
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN')")
	public UserResponse create(SignupRequest request) {
		if (userRepository.existsByEmail(request.email().toLowerCase())) {
			throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
		}
		User user = User.builder()
				.name(request.name())
				.email(request.email().toLowerCase())
				.password(passwordEncoder.encode(request.password()))
				.role(request.role())
				.build();
		return UserResponse.from(userRepository.save(user));
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN')")
	public void delete(Long id) {
		User current = currentUserService.user();
		if (current.getId().equals(id)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot remove your own admin account");
		}
		User user = userRepository.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
		if (user.getRole() == Role.ADMIN) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Admin accounts cannot be removed from Team");
		}
		projectRepository.findAll().forEach(project ->
				project.getMembers().removeIf(member -> member.getId().equals(id)));
		taskRepository.deleteByAssignedToId(id);
		userRepository.delete(user);
	}
}
