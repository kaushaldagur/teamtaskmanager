package com.kaushal.teamtaskmanager.dto;

import com.kaushal.teamtaskmanager.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
	private AuthDtos() {
	}

	public record SignupRequest(
			@NotBlank @Size(min = 2, max = 80) String name,
			@NotBlank @Email String email,
			@NotBlank @Size(min = 6, max = 80) String password,
			@NotNull Role role) {
	}

	public record LoginRequest(
			@NotBlank @Email String email,
			@NotBlank String password) {
	}

	public record AuthResponse(String token, UserResponse user) {
	}
}
