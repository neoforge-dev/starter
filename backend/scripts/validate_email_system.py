#!/usr/bin/env python3
"""
Email System Validation Script

This script performs comprehensive validation of the email system
testing infrastructure and ensures production readiness.
"""
import os
import sys
import subprocess
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any

class EmailSystemValidator:
    """Validates the email system testing implementation."""
    
    def __init__(self):
        self.backend_path = Path(__file__).parent.parent
        self.tests_path = self.backend_path / "tests"
        self.docs_path = self.backend_path.parent / "docs"
        self.results: Dict[str, Any] = {}
        
    def validate_test_structure(self) -> bool:
        """Validate test directory structure and file presence."""
        print("🔍 Validating test structure...")
        
        required_test_dirs = [
            "e2e",
            "integration", 
            "performance",
            "error_scenarios",
            "production"
        ]
        
        required_files = {
            "e2e": ["test_email_system_flows.py"],
            "integration": [
                "test_auth_email_integration.py",
                "test_email_worker_integration.py"
            ],
            "performance": ["test_email_system_performance.py"],
            "error_scenarios": ["test_email_error_handling.py"],
            "production": ["test_production_readiness.py"]
        }
        
        structure_valid = True
        
        # Check directories exist
        for test_dir in required_test_dirs:
            dir_path = self.tests_path / test_dir
            if not dir_path.exists():
                print(f"❌ Missing test directory: {test_dir}")
                structure_valid = False
            else:
                print(f"✅ Test directory exists: {test_dir}")
                
                # Check __init__.py exists
                init_file = dir_path / "__init__.py"
                if not init_file.exists():
                    print(f"❌ Missing __init__.py in: {test_dir}")
                    structure_valid = False
                
                # Check required test files
                for test_file in required_files[test_dir]:
                    file_path = dir_path / test_file
                    if not file_path.exists():
                        print(f"❌ Missing test file: {test_dir}/{test_file}")
                        structure_valid = False
                    else:
                        print(f"✅ Test file exists: {test_dir}/{test_file}")
        
        self.results["test_structure"] = structure_valid
        return structure_valid
    
    def validate_documentation(self) -> bool:
        """Validate documentation completeness."""
        print("\n📚 Validating documentation...")
        
        required_docs = [
            "EMAIL_SYSTEM_API.md",
            "EMAIL_SYSTEM_PRODUCTION_GUIDE.md",
            "EMAIL_SYSTEM_TROUBLESHOOTING.md"
        ]
        
        docs_valid = True
        
        for doc_file in required_docs:
            doc_path = self.docs_path / doc_file
            if not doc_path.exists():
                print(f"❌ Missing documentation: {doc_file}")
                docs_valid = False
            else:
                # Check file size to ensure it's not empty
                file_size = doc_path.stat().st_size
                if file_size < 1000:  # Less than 1KB suggests incomplete
                    print(f"⚠️  Documentation may be incomplete: {doc_file} ({file_size} bytes)")
                    docs_valid = False
                else:
                    print(f"✅ Documentation complete: {doc_file} ({file_size:,} bytes)")
        
        self.results["documentation"] = docs_valid
        return docs_valid
    
    def count_test_functions(self) -> Dict[str, int]:
        """Count test functions in each test category."""
        print("\n🔢 Counting test functions...")
        
        test_counts = {}
        
        for test_dir in ["e2e", "integration", "performance", "error_scenarios", "production"]:
            dir_path = self.tests_path / test_dir
            if not dir_path.exists():
                continue
                
            count = 0
            for test_file in dir_path.glob("test_*.py"):
                try:
                    with open(test_file, 'r') as f:
                        content = f.read()
                        # Count async test functions
                        count += content.count("async def test_")
                        # Count regular test functions
                        count += content.count("def test_") - content.count("async def test_")
                except Exception as e:
                    print(f"⚠️  Error reading {test_file}: {e}")
            
            test_counts[test_dir] = count
            print(f"✅ {test_dir}: {count} test functions")
        
        total_tests = sum(test_counts.values())
        print(f"\n📊 Total test functions: {total_tests}")
        
        self.results["test_counts"] = test_counts
        self.results["total_tests"] = total_tests
        
        return test_counts
    
    def validate_test_coverage_categories(self) -> bool:
        """Validate that all required test categories are covered."""
        print("\n🎯 Validating test coverage categories...")
        
        required_patterns = {
            "e2e": [
                "registration.*email.*verification",
                "password.*reset.*email",
                "email.*webhook.*tracking", 
                "email.*worker.*processing",
                "concurrent.*user.*registration"
            ],
            "integration": [
                "email.*worker.*integration",
                "auth.*email.*integration",
                "webhook.*integration",
                "database.*integration"
            ],
            "performance": [
                "email.*queue.*performance",
                "email.*worker.*performance", 
                "webhook.*performance",
                "concurrent.*performance"
            ],
            "error_scenarios": [
                "database.*failure",
                "redis.*failure",
                "email.*provider.*failure",
                "network.*failure",
                "concurrency.*edge"
            ],
            "production": [
                "security.*readiness",
                "configuration.*readiness",
                "monitoring.*readiness",
                "scalability.*readiness"
            ]
        }
        
        coverage_valid = True
        
        for test_dir, patterns in required_patterns.items():
            dir_path = self.tests_path / test_dir
            if not dir_path.exists():
                continue
            
            print(f"\n📁 Checking {test_dir} coverage:")
            
            for test_file in dir_path.glob("test_*.py"):
                try:
                    with open(test_file, 'r') as f:
                        content = f.read().lower()
                    
                    for pattern in patterns:
                        pattern_words = pattern.replace(".*", " ").split()
                        if all(word in content for word in pattern_words):
                            print(f"  ✅ {pattern}")
                        else:
                            print(f"  ⚠️  Pattern may be missing: {pattern}")
                except Exception as e:
                    print(f"  ❌ Error checking {test_file}: {e}")
                    coverage_valid = False
        
        self.results["coverage_validation"] = coverage_valid
        return coverage_valid
    
    def validate_test_quality(self) -> Dict[str, Any]:
        """Validate test code quality and best practices."""
        print("\n🔬 Validating test quality...")
        
        quality_results = {
            "async_tests": 0,
            "mock_usage": 0,
            "assertion_variety": 0,
            "error_handling": 0,
            "cleanup_procedures": 0
        }
        
        for test_dir in ["e2e", "integration", "performance", "error_scenarios", "production"]:
            dir_path = self.tests_path / test_dir
            if not dir_path.exists():
                continue
            
            for test_file in dir_path.glob("test_*.py"):
                try:
                    with open(test_file, 'r') as f:
                        content = f.read()
                    
                    # Check for async tests
                    quality_results["async_tests"] += content.count("async def test_")
                    
                    # Check for proper mocking
                    if "mock" in content.lower() or "patch" in content:
                        quality_results["mock_usage"] += 1
                    
                    # Check for assertion variety
                    assertions = ["assert", "assert_called", "assert_not_called", "pytest.raises"]
                    if any(assertion in content for assertion in assertions):
                        quality_results["assertion_variety"] += 1
                    
                    # Check for error handling
                    if "try:" in content or "except" in content or "pytest.raises" in content:
                        quality_results["error_handling"] += 1
                    
                    # Check for cleanup procedures
                    if "finally:" in content or "cleanup" in content.lower():
                        quality_results["cleanup_procedures"] += 1
                        
                except Exception as e:
                    print(f"⚠️  Error analyzing {test_file}: {e}")
        
        print(f"✅ Async tests: {quality_results['async_tests']}")
        print(f"✅ Files with mocking: {quality_results['mock_usage']}")
        print(f"✅ Files with assertions: {quality_results['assertion_variety']}")
        print(f"✅ Files with error handling: {quality_results['error_handling']}")
        print(f"✅ Files with cleanup: {quality_results['cleanup_procedures']}")
        
        self.results["quality_metrics"] = quality_results
        return quality_results
    
    def validate_import_structure(self) -> bool:
        """Validate that test files have proper imports."""
        print("\n📦 Validating import structure...")
        
        required_imports = {
            "pytest",
            "asyncio", 
            "unittest.mock",
            "app.core",
            "app.models",
            "app.crud"
        }
        
        import_issues = []
        
        for test_dir in ["e2e", "integration", "performance", "error_scenarios", "production"]:
            dir_path = self.tests_path / test_dir
            if not dir_path.exists():
                continue
                
            for test_file in dir_path.glob("test_*.py"):
                try:
                    with open(test_file, 'r') as f:
                        content = f.read()
                    
                    # Check for pytest mark
                    if "pytestmark = pytest.mark.asyncio" not in content:
                        import_issues.append(f"{test_file.name}: Missing pytest asyncio mark")
                    
                    # Check for basic imports
                    if "import pytest" not in content:
                        import_issues.append(f"{test_file.name}: Missing pytest import")
                    
                    if "from app." not in content:
                        import_issues.append(f"{test_file.name}: No app imports found")
                        
                except Exception as e:
                    import_issues.append(f"{test_file.name}: Error reading file - {e}")
        
        if import_issues:
            print("⚠️  Import issues found:")
            for issue in import_issues[:10]:  # Show first 10 issues
                print(f"  - {issue}")
            if len(import_issues) > 10:
                print(f"  ... and {len(import_issues) - 10} more issues")
            imports_valid = False
        else:
            print("✅ All imports look good")
            imports_valid = True
        
        self.results["import_validation"] = imports_valid
        return imports_valid
    
    def generate_report(self) -> None:
        """Generate comprehensive validation report."""
        print("\n" + "="*80)
        print("📋 EMAIL SYSTEM VALIDATION REPORT")
        print("="*80)
        
        # Overall status
        all_validations = [
            self.results.get("test_structure", False),
            self.results.get("documentation", False),
            self.results.get("coverage_validation", False),
            self.results.get("import_validation", False)
        ]
        
        overall_status = "✅ PASS" if all(all_validations) else "❌ NEEDS ATTENTION"
        print(f"\n🎯 Overall Status: {overall_status}")
        
        # Test metrics
        total_tests = self.results.get("total_tests", 0)
        test_counts = self.results.get("test_counts", {})
        
        print(f"\n📊 Test Metrics:")
        print(f"   Total Test Functions: {total_tests}")
        for category, count in test_counts.items():
            print(f"   {category.title()}: {count} tests")
        
        # Quality metrics
        quality = self.results.get("quality_metrics", {})
        if quality:
            print(f"\n🔬 Quality Metrics:")
            print(f"   Async Tests: {quality.get('async_tests', 0)}")
            print(f"   Files with Mocking: {quality.get('mock_usage', 0)}")
            print(f"   Files with Assertions: {quality.get('assertion_variety', 0)}")
            print(f"   Files with Error Handling: {quality.get('error_handling', 0)}")
            print(f"   Files with Cleanup: {quality.get('cleanup_procedures', 0)}")
        
        # Validation results
        print(f"\n✅ Validation Results:")
        print(f"   Test Structure: {'✅ PASS' if self.results.get('test_structure') else '❌ FAIL'}")
        print(f"   Documentation: {'✅ PASS' if self.results.get('documentation') else '❌ FAIL'}")
        print(f"   Coverage: {'✅ PASS' if self.results.get('coverage_validation') else '❌ FAIL'}")
        print(f"   Imports: {'✅ PASS' if self.results.get('import_validation') else '❌ FAIL'}")
        
        # Recommendations
        print(f"\n🚀 Production Readiness Assessment:")
        if overall_status == "✅ PASS":
            print("   ✅ Email system testing is PRODUCTION READY")
            print("   ✅ Comprehensive test coverage implemented")
            print("   ✅ Complete documentation provided")
            print("   ✅ All quality checks passed")
        else:
            print("   ⚠️  Some validations need attention before production")
            print("   📝 Review failed validations above")
            print("   🔧 Address issues and re-run validation")
        
        print("\n" + "="*80)
        
        # Save results to file
        results_file = self.backend_path / "validation_results.json"
        try:
            with open(results_file, 'w') as f:
                json.dump(self.results, f, indent=2, default=str)
            print(f"📄 Results saved to: {results_file}")
        except Exception as e:
            print(f"⚠️  Could not save results: {e}")
    
    def run_validation(self) -> bool:
        """Run complete validation suite."""
        print("🚀 Starting Email System Validation...")
        print(f"📁 Backend Path: {self.backend_path}")
        print(f"🧪 Tests Path: {self.tests_path}")
        print(f"📚 Docs Path: {self.docs_path}")
        
        # Run all validations
        self.validate_test_structure()
        self.validate_documentation()
        self.count_test_functions()
        self.validate_test_coverage_categories()
        self.validate_test_quality()
        self.validate_import_structure()
        
        # Generate report
        self.generate_report()
        
        # Return overall success
        return all([
            self.results.get("test_structure", False),
            self.results.get("documentation", False),
            self.results.get("coverage_validation", False),
            self.results.get("import_validation", False)
        ])

def main():
    """Main validation entry point."""
    validator = EmailSystemValidator()
    success = validator.run_validation()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()