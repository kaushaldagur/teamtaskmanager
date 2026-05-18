package com.kaushal.teamtaskmanager.service;

import com.kaushal.teamtaskmanager.entity.User;
import com.kaushal.teamtaskmanager.exception.ApiException;
import com.kaushal.teamtaskmanager.security.AppUserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {
	public User user() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrincipal principal)) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "Login required");
		}
		return principal.user();
	}
}
