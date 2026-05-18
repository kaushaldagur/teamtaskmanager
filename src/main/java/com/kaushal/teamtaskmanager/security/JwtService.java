package com.kaushal.teamtaskmanager.security;

import com.kaushal.teamtaskmanager.entity.User;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
	private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
	private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
	private static final Pattern SUBJECT_PATTERN = Pattern.compile("\"sub\"\\s*:\\s*\"([^\"]+)\"");
	private static final Pattern EXP_PATTERN = Pattern.compile("\"exp\"\\s*:\\s*(\\d+)");
	private final byte[] secret;
	private final long ttlSeconds;

	public JwtService(
			@Value("${ethara.jwt.secret}") String secret,
			@Value("${ethara.jwt.ttl-seconds}") long ttlSeconds) {
		this.secret = secret.getBytes(StandardCharsets.UTF_8);
		this.ttlSeconds = ttlSeconds;
	}

	public String generate(User user) {
		Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
		String payload = "{"
				+ "\"sub\":\"" + escape(user.getEmail()) + "\","
				+ "\"userId\":" + user.getId() + ","
				+ "\"role\":\"" + user.getRole().name() + "\","
				+ "\"exp\":" + Instant.now().plusSeconds(ttlSeconds).getEpochSecond()
				+ "}";
		String unsigned = encodeHeader(header) + "." + ENCODER.encodeToString(payload.getBytes(StandardCharsets.UTF_8));
		return unsigned + "." + sign(unsigned);
	}

	public String subject(String token) {
		String payload = verifyAndReadPayload(token);
		Matcher subjectMatcher = SUBJECT_PATTERN.matcher(payload);
		if (!subjectMatcher.find()) {
			throw new IllegalArgumentException("Invalid token");
		}
		return subjectMatcher.group(1);
	}

	private String verifyAndReadPayload(String token) {
		try {
			String[] parts = token.split("\\.");
			if (parts.length != 3 || !sign(parts[0] + "." + parts[1]).equals(parts[2])) {
				throw new IllegalArgumentException("Invalid token");
			}
			String payload = new String(DECODER.decode(parts[1]), StandardCharsets.UTF_8);
			Matcher expMatcher = EXP_PATTERN.matcher(payload);
			if (!expMatcher.find()) {
				throw new IllegalArgumentException("Invalid token");
			}
			long exp = Long.parseLong(expMatcher.group(1));
			if (Instant.now().getEpochSecond() > exp) {
				throw new IllegalArgumentException("Token expired");
			}
			return payload;
		}
		catch (Exception ex) {
			throw new IllegalArgumentException("Invalid token");
		}
	}

	private String encodeHeader(Map<String, Object> source) {
		String header = "{\"alg\":\"" + source.get("alg") + "\",\"typ\":\"" + source.get("typ") + "\"}";
		return ENCODER.encodeToString(header.getBytes(StandardCharsets.UTF_8));
	}

	private String escape(String value) {
		return value.replace("\\", "\\\\").replace("\"", "\\\"");
	}

	private String sign(String unsignedToken) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(secret, "HmacSHA256"));
			return ENCODER.encodeToString(mac.doFinal(unsignedToken.getBytes(StandardCharsets.UTF_8)));
		}
		catch (Exception ex) {
			throw new IllegalStateException("Unable to sign token");
		}
	}
}
