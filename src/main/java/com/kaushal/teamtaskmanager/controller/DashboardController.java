package com.kaushal.teamtaskmanager.controller;

import com.kaushal.teamtaskmanager.dto.DashboardDtos.DashboardResponse;
import com.kaushal.teamtaskmanager.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
	private final DashboardService dashboardService;

	@GetMapping
	public DashboardResponse dashboard() {
		return dashboardService.dashboard();
	}
}
