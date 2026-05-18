package com.kaushal.teamtaskmanager.service;

import com.kaushal.teamtaskmanager.dto.AuthDtos.AuthResponse;
import com.kaushal.teamtaskmanager.dto.AuthDtos.LoginRequest;
import com.kaushal.teamtaskmanager.dto.AuthDtos.SignupRequest;
import com.kaushal.teamtaskmanager.dto.UserResponse;
import com.kaushal.teamtaskmanager.entity.User;
import com.kaushal.teamtaskmanager.exception.ApiException;
import com.kaushal.teamtaskmanager.repository.UserRepository;
import com.kaushal.teamtaskmanager.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final JwtService jwtService;

	@Transactional
	public AuthResponse signup(SignupRequest request) {
		if (userRepository.existsByEmail(request.email())) {
			throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
		}
		User user = User.builder()
				.name(request.name())
				.email(request.email().toLowerCase())
				.password(passwordEncoder.encode(request.password()))
				.role(request.role())
				.build();
		userRepository.save(user);
		return new AuthResponse(jwtService.generate(user), UserResponse.from(user));
	}

	public AuthResponse login(LoginRequest request) {
		authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(request.email().toLowerCase(), request.password()));
		User user = userRepository.findByEmail(request.email().toLowerCase())
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
		return new AuthResponse(jwtService.generate(user), UserResponse.from(user));
	}
}
