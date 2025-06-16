# Changelog

## [0.0.2] - 2025-01-15

### Security
- **CRITICAL**: Fixed HIGH severity vulnerabilities in axios (GHSA-8hc4-vh64-cxmj, GHSA-jr5f-v2jv-69x6)
  - Updated axios from 1.6.0 to 1.10.0
  - Fixes SSRF vulnerability and credential leakage issues
- Fixed moderate/low severity vulnerabilities in express (GHSA-rv95-896h-c2vc, GHSA-qw6h-vgh9-j6wx)
  - Updated express from 4.18.0 to 5.1.0
  - Fixes open redirect vulnerability and XSS issues

### Updated
- **@modelcontextprotocol/sdk**: 1.0.0 → 1.12.3
  - Major feature updates including enhanced transport support
  - Improved session management and OAuth capabilities
  - Better error handling and debugging features
- **vue**: 3.3.8 → 3.5.16
  - Minor improvements and bug fixes
  - Enhanced TypeScript support
- **jsonwebtoken**: 9.0.0 → 9.0.2
  - Security patches and stability improvements

### Fixed
- Jest configuration for proper TypeScript module resolution
- Test setup for MCP server integration testing
- Mock implementations for SiYuan module dependencies

### Technical
- All dependencies now at latest stable versions
- Zero security vulnerabilities detected
- Full compatibility maintained with existing functionality
- Integration tests passing successfully
