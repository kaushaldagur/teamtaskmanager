package com.kaushal.teamtaskmanager.dto;

import com.kaushal.teamtaskmanager.entity.Role;
import com.kaushal.teamtaskmanager.entity.User;

public record UserResponse(Long id, String name, String email, Role role) {
	public static UserResponse from(User user) {
		return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
	}
}
