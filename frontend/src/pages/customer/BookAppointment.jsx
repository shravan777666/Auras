import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import BackButton from '../../components/common/BackButton';
import { customerService } from "../../services/customer";
import { loyaltyService } from "../../services/loyalty";
import { cancellationPolicyService } from "../../services/cancellationPolicy";
import { default as packageService } from "../../services/packageService";
import { freelancerService } from "../../services/freelancerService";
import giftCardService from "../../services/giftCardService";
import addOnOfferService from "../../services/addOnOffer";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SalonAvailabilityDisplay from "../../components/customer/SalonAvailabilityDisplay";
import LoyaltyRedemptionWidget from "../../components/customer/LoyaltyRedemptionWidget";
import CancellationPolicyDisplay from '../../components/customer/CancellationPolicyDisplay';
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { Clock, Home } from "lucide-react";

const BookAppointment = () => {
  const { salonId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // =========== ADD DEBUG LOGGING ===========
  console.log('=== BOOK APPOINTMENT LOADING ===');
  console.log('salonId from URL:', salonId);
  console.log('Full URL:', window.location.href);
  console.log('URL search params:', location.search);
  const urlParams = new URLSearchParams(location.search);
  const homeServiceParam = urlParams.get('homeService');
  console.log('homeService param:', homeServiceParam);
  console.log('Location state:', location.state);
  console.log('================================');
  // =========== END DEBUG LOGGING ===========
  
  const [loading, setLoading] = useState(true);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [salon, setSalon] = useState(null);
  const [salonList, setSalonList] = useState([]);
  const [salonsLoading, setSalonsLoading] = useState(false);
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [dateError, setDateError] = useState("");
  const [isHomeService, setIsHomeService] = useState(false);
  const [homeServiceAddress, setHomeServiceAddress] = useState("");
  const [redemptionData, setRedemptionData] = useState({
    usePoints: false,
    pointsToRedeem: 0,
    discountAmount: 0
  });
  const [idleSlots, setIdleSlots] = useState([]);
  const [addonSuggestions, setAddonSuggestions] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [addOnOffers, setAddOnOffers] = useState([]); // Database add-on offers
  const [addOnOffersLoading, setAddOnOffersLoading] = useState(false);
  const [selectedOffers, setSelectedOffers] = useState([]); // Selected add-on offers for tracking
  const [showPaymentButton, setShowPaymentButton] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  
  // Budget Finder states
  const [budget, setBudget] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState('services'); // 'services', 'giftcards', 'packages'
  
  // Gift Cards state
  const [giftCards, setGiftCards] = useState([]);
  const [giftCardsLoading, setGiftCardsLoading] = useState(false);

  // Check URL parameters for home service and update when location changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const homeServiceParam = urlParams.get('homeService');
    setIsHomeService(homeServiceParam === 'true');
  }, [location.search]);

  // Check for pre-filled data from one-click booking widget or loyalty redemption
  useEffect(() => {
    const preselectedData = location.state;
    if (preselectedData) {
      // Set preselected salon if available
      if (preselectedData.preselectedSalon && !salonId) {
        navigate(`/customer/book-appointment/${preselectedData.preselectedSalon}`, { replace: true });
      }
      
      // Set preselected date and time
      if (preselectedData.preselectedDate) {
        setAppointmentDate(preselectedData.preselectedDate);
      }
      if (preselectedData.preselectedTime) {
        setAppointmentTime(preselectedData.preselectedTime);
      }
      
      // Check if loyalty points redemption was preselected
      if (preselectedData.redeemPoints) {
        setRedemptionData(prev => ({
          ...prev,
          usePoints: true
        }));
      }
      
      // Check if home service address was passed
      if (preselectedData.homeAddress) {
        setHomeServiceAddress(preselectedData.homeAddress);
      }
    }
  }, [salonId, location.state, navigate]);

  // =========== FIXED: Updated useEffect dependencies ===========
  useEffect(() => {
    if (!salonId) {
      setLoading(false);
      return;
    }

    fetchEntityDetails();
  }, [salonId, location.search]); // Changed from [salonId, isHomeService] to [salonId, location.search]

  // =========== FIXED: Updated fetchEntityDetails function ===========
  const fetchEntityDetails = async () => {
    setLoading(true);
    try {
      console.log('Fetching entity details for ID:', salonId);
      
      // Check URL params to determine if this is a home service booking
      const urlParams = new URLSearchParams(location.search);
      const isHomeBooking = urlParams.get('homeService') === 'true';
      console.log('Is home booking?', isHomeBooking);
      
      if (isHomeBooking) {
        console.log('Fetching as FREELANCER for home service...');
        // Fetch as freelancer
        const res = await freelancerService.getFreelancerById(salonId);
        console.log('Freelancer API response:', res);
        
        if (res?.success) {
          const freelancerData = {
            ...res.data,
            services: res.data.services || [],
            name: res.data.name,
            address: res.data.address,
            _id: res.data._id,
            staff: [{
              _id: res.data._id,
              name: res.data.name,
              profilePic: res.data.profilePic,
              specialties: res.data.skills || []
            }]
          };
          setSalon(freelancerData);
          setIsFreelancer(true);
          setIsHomeService(true);
          console.log('Set as freelancer:', freelancerData.name);
        } else {
          throw new Error('Freelancer not found or not approved');
        }
      } else {
        console.log('Fetching as SALON...');
        // Fetch as salon
        const res = await customerService.getSalonDetails(salonId);
        console.log('Salon API response:', res);
        
        if (res?.success) {
          setSalon(res.data);
          setIsFreelancer(false);
          setIsHomeService(false);
          console.log('Set as salon:', res.data.salonName || res.data.name);
        } else {
          throw new Error('Salon not found');
        }
      }
    } catch (e) {
      console.error('Error loading entity details:', e);
      
      // Check if this was a home service booking attempt
      const urlParams = new URLSearchParams(location.search);
      const isHomeBooking = urlParams.get('homeService') === 'true';
      
      if (isHomeBooking) {
        toast.error("This beautician is not available for home service.");
        navigate('/customer/home-service');
      } else {
        toast.error("This salon is not available.");
        navigate('/customer/explore-salons');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch packages for the salon
  useEffect(() => {
    if (!salonId || isHomeService || !salon) return; // Don't fetch packages for home service (freelancers)
    
    const fetchPackages = async () => {
      try {
        setPackagesLoading(true);
        console.log('Fetching packages for salon:', salonId);
        
        const res = await packageService.getCustomerPackages(salonId);
        if (res?.success) {
          console.log('Packages fetched:', res.data?.length);
          setPackages(res.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch packages:", error);
        setPackages([]);
      } finally {
        setPackagesLoading(false);
      }
    };
    
    fetchPackages();
  }, [salonId, isHomeService, salon]);
  
  // Fetch gift cards when gift cards tab is selected
  useEffect(() => {
    if (!salonId || isHomeService || !salon || activeTab !== 'giftcards') return;
    
    const fetchGiftCards = async () => {
      try {
        setGiftCardsLoading(true);
        console.log('Fetching gift cards for salon:', salonId);
        
        const res = await giftCardService.getActiveGiftCards(salonId);
        if (res?.success) {
          console.log('Gift cards fetched:', res.data?.length);
          setGiftCards(res.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch gift cards:", error);
        setGiftCards([]);
      } finally {
        setGiftCardsLoading(false);
      }
    };
    
    fetchGiftCards();
  }, [salonId, isHomeService, salon, activeTab]);

  useEffect(() => {
    if (salonId) return;

    const fetchInitialData = async () => {
      try {
        setSalonsLoading(true);
        if (isHomeService) {
          const res = await freelancerService.getApprovedFreelancers({ page: 1, limit: 30 });
          if (res?.success) {
            const freelancersAsSalons = res.data.map(f => ({
              _id: f._id,
              salonName: f.name,
              salonAddress: f.address,
              documents: { salonLogo: f.profilePic }
            }));
            setSalonList(freelancersAsSalons);
          }
        } else {
          const res = await customerService.browseSalons({ page: 1, limit: 30 });
          if (res?.success) {
            setSalonList(res.data || []);
          }
        }
      } catch (e) {
        console.error('Error fetching initial data:', e);
      } finally {
        setSalonsLoading(false);
      }
    };

    fetchInitialData();
  }, [salonId, isHomeService]);

  // Trigger addon suggestions when we have salon data and user info
  useEffect(() => {
    if (salon && user && addonSuggestions.length === 0) {
      console.log('Triggering initial addon suggestions');
      const timer = setTimeout(() => {
        suggestAddonsBasedOnHistory();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [salon, user, addonSuggestions.length]);

  // Additional trigger for addon suggestions when services are selected
  useEffect(() => {
    if (salon && user && selectedServices.length > 0 && addonSuggestions.length === 0) {
      console.log('Triggering addon suggestions based on selected services');
      const timer = setTimeout(() => {
        suggestAddonsBasedOnHistory();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedServices.length, salon, user, addonSuggestions.length]);

  // Detect idle slots when date and time are selected
  useEffect(() => {
    if (!salonId || isHomeService || !appointmentDate) return;
    
    console.log('Detecting idle slots for:', { salonId, appointmentDate, appointmentTime });
    
    const detectIdleSlots = async () => {
      try {
        const dateStr = appointmentDate;
        const res = await customerService.detectIdleSlots(salonId, dateStr);
        console.log('Idle slots response:', res);
        if (res?.success) {
          setIdleSlots(res.data || []);
          if (res.data?.length > 0) {
            console.log('Found idle slots, suggesting addons:', res.data[0]);
            suggestAddons(res.data[0]);
          } else {
            console.log('No idle slots found, suggesting based on history');
            suggestAddonsBasedOnHistory();
          }
        }
      } catch (error) {
        console.error("Failed to detect idle slots:", error);
        suggestAddonsBasedOnHistory();
      }
    };

    const timer = setTimeout(detectIdleSlots, 500);
    return () => clearTimeout(timer);
  }, [salonId, appointmentDate, isHomeService]);

  // Initialize with default suggestions when services are selected
  useEffect(() => {
    if (!salon || !user) return;
    
    if (selectedServices.length > 0 && addonSuggestions.length === 0) {
      console.log('Services selected, initializing addon suggestions');
      const timer = setTimeout(() => {
        suggestAddonsBasedOnHistory();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedServices.length, addonSuggestions.length, salon, user]);

  // Always ensure addon suggestions are available when services are selected
  useEffect(() => {
    if (!salon || !user) return;
    
    if (selectedServices.length > 0 && addonSuggestions.length === 0) {
      console.log('Ensuring addon suggestions are available');
      const timer = setTimeout(() => {
        if (addonSuggestions.length === 0) {
          console.log('Generating fallback addon suggestions');
          generateFallbackSuggestions();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [selectedServices.length, addonSuggestions.length, salon, user]);

  // Ensure addon suggestions are always available
  useEffect(() => {
    if (!salon || !user) return;
    
    if (selectedServices.length > 0) {
      const fallbackTimer = setTimeout(() => {
        if (addonSuggestions.length === 0) {
          console.log('Generating fallback addon suggestions');
          generateFallbackSuggestions();
        }
      }, 3000);
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [selectedServices.length, addonSuggestions.length, salon, user]);

  // Fetch recommended products when services are selected
  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      if (!salonId || isHomeService || selectedServices.length === 0 || !user) return;
      
      try {
        setProductsLoading(true);
        
        const firstService = selectedServices[0];
        if (!firstService) return;
        
        let serviceId = firstService;
        if (typeof firstService === 'string') {
          serviceId = firstService;
        } else if (typeof firstService === 'object' && firstService.serviceId) {
          serviceId = firstService.serviceId;
        } else if (typeof firstService === 'object' && firstService._id) {
          serviceId = firstService._id;
        }
        
        if (!serviceId || typeof serviceId !== 'string' || serviceId.length < 12) {
          console.warn('Invalid serviceId for recommendations:', serviceId);
          return;
        }
        
        const res = await customerService.getRecommendedProducts(serviceId, salonId);
        if (res?.success && res.data) {
          setRecommendedProducts(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch recommended products:', error);
        setRecommendedProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    
    fetchRecommendedProducts();
  }, [selectedServices.length, selectedPackages.length, salonId, user, isHomeService]);

  // Fetch active add-on offers from database using salonId from URL
  useEffect(() => {
    const fetchAddOnOffers = async () => {
      if (!salonId || isFreelancer) {
        console.log('Skipping add-on offers fetch:', { salonId, isFreelancer });
        return;
      }
      
      try {
        setAddOnOffersLoading(true);
        console.log('Fetching add-on offers for salonId:', salonId);
        const response = await addOnOfferService.getActiveOffers(salonId);
        
        console.log('Add-on offers response:', response);
        
        if (response.success && response.data) {
          console.log('Setting add-on offers:', response.data);
          setAddOnOffers(response.data);
        } else {
          console.log('No offers data in response');
          setAddOnOffers([]);
        }
      } catch (error) {
        console.error('Error fetching add-on offers:', error);
        setAddOnOffers([]);
      } finally {
        setAddOnOffersLoading(false);
      }
    };

    fetchAddOnOffers();
  }, [salonId, isFreelancer]);

  // Suggest add-ons based on customer history (fallback when no idle slots)
  const suggestAddonsBasedOnHistory = async () => {
    try {
      console.log('Suggesting addons based on customer history');
      
      if (salon?.services?.length > 0) {
        const availableServices = salon.services.filter(
          service => !selectedServices.some(selected => {
            if (typeof selected === 'string') {
              return selected === service._id;
            } else if (typeof selected === 'object' && selected.serviceId) {
              return selected.serviceId === service._id;
            } else if (typeof selected === 'object' && selected._id) {
              return selected._id === service._id;
            }
            return false;
          })
        );
        
        if (availableServices.length > 0) {
          let customerData = null;
          try {
            if (!isHomeService) {
              const historyRes = await customerService.getCustomerHistory(user.id, salonId);
              console.log('Customer history response:', historyRes);
              if (historyRes?.success) {
                customerData = historyRes.data;
              }
            }
          } catch (error) {
            console.warn("Failed to get customer history, using defaults:", error);
          }
          
          const suggestions = [];
          const maxSuggestions = Math.min(3, availableServices.length);
          
          for (let i = 0; i < maxSuggestions; i++) {
            const suggestedService = availableServices[i];
            let baseDiscount = 0.15;
            if (customerData?.customerLoyalty > 5) {
              baseDiscount = 0.20;
            } else if (customerData?.customerLoyalty > 10) {
              baseDiscount = 0.25;
            }
            
            const discountRate = baseDiscount + (i * 0.03);
            
            suggestions.push({
              service: suggestedService,
              gapSize: 30,
              discount: Math.min(0.30, discountRate),
              estimatedPrice: suggestedService.discountedPrice || suggestedService.price
            });
          }
          
          console.log('Setting addon suggestions based on history:', suggestions);
          setAddonSuggestions(suggestions);
          return;
        }
      }
      
      generateDefaultSuggestions();
    } catch (error) {
      console.error("Failed to suggest add-ons based on history:", error);
      generateDefaultSuggestions();
    }
  };

  // Generate default suggestions when everything else fails
  const generateDefaultSuggestions = () => {
    console.log('Generating default addon suggestions');
    
    if (salon?.services?.length > 0) {
      const availableServices = salon.services.filter(
        service => !selectedServices.some(selected => {
          if (typeof selected === 'string') {
            return selected === service._id;
          } else if (typeof selected === 'object' && selected.serviceId) {
            return selected.serviceId === service._id;
          } else if (typeof selected === 'object' && selected._id) {
            return selected._id === service._id;
          }
          return false;
        })
      );
      
      if (availableServices.length > 0) {
        const suggestions = [];
        const maxSuggestions = Math.min(2, availableServices.length);
        
        for (let i = 0; i < maxSuggestions; i++) {
          const service = availableServices[i];
          suggestions.push({
            service: service,
            gapSize: 30,
            discount: 0.15 + (i * 0.05),
            estimatedPrice: service.discountedPrice || service.price || 0
          });
        }
        
        console.log('Setting default addon suggestions:', suggestions);
        setAddonSuggestions(suggestions);
        return;
      }
    }
    
    setAddonSuggestions([{
      service: {
        _id: 'generic_service',
        name: 'Premium Hair Treatment',
        category: 'Treatment',
        price: 300,
        discountedPrice: 240
      },
      gapSize: 45,
      discount: 0.20,
      estimatedPrice: 300
    }]);
  };

  // Suggest add-ons based on idle slot and customer history
  const suggestAddons = async (idleSlot) => {
    if (!user?.id || !salonId || !idleSlot) return;
    
    try {
      console.log('Suggesting addons based on idle slot:', idleSlot);
      const historyRes = await customerService.getCustomerHistory(user.id, salonId);
      console.log('Customer history response:', historyRes);
      
      const predictionData = {
        timeGapSize: idleSlot.gapSize,
        customerId: user.id,
        salonId: salonId,
        dayOfWeek: new Date(appointmentDate).getDay()
      };
      
      console.log('Prediction data:', predictionData);
      
      const predictionRes = await customerService.predictAddonAcceptance(predictionData);
      console.log('Prediction response:', predictionRes);
      
      if (salon?.services?.length > 0) {
        const availableServices = salon.services.filter(
          service => !selectedServices.some(selected => {
            if (typeof selected === 'string') {
              return selected === service._id;
            } else if (typeof selected === 'object' && selected.serviceId) {
              return selected.serviceId === service._id;
            } else if (typeof selected === 'object' && selected._id) {
              return selected._id === service._id;
            }
            return false;
          })
        );
        
        if (availableServices.length > 0) {
          let discountRate = 0.15;
          if (predictionRes?.success && predictionRes.data?.probability) {
            discountRate = 0.1 + (predictionRes.data.probability * 0.2);
          }
          
          const maxSuggestions = Math.min(2, availableServices.length);
          const suggestions = [];
          
          for (let i = 0; i < maxSuggestions; i++) {
            const suggestedService = availableServices[i];
            const serviceDiscount = discountRate + (i * 0.03);
            
            suggestions.push({
              service: suggestedService,
              gapSize: idleSlot.gapSize,
              discount: Math.min(0.30, serviceDiscount),
              estimatedPrice: suggestedService.discountedPrice || suggestedService.price
            });
          }
          
          console.log('Setting addon suggestions based on idle slot:', suggestions);
          setAddonSuggestions(suggestions);
        }
      }
    } catch (error) {
      console.error("Failed to suggest add-ons:", error);
      suggestAddonsBasedOnHistory();
    }
  };

  // Generate comprehensive fallback suggestions
  const generateFallbackSuggestions = () => {
    if (!salon?.services?.length) {
      setAddonSuggestions([{
        service: {
          _id: 'generic_addon',
          name: 'Premium Consultation',
          category: 'Consultation',
          price: 200,
          discountedPrice: 150
        },
        gapSize: 30,
        discount: 0.25,
        estimatedPrice: 200
      }]);
      return;
    }
    
    const availableServices = salon.services.filter(
      service => !selectedServices.some(selected => {
        if (typeof selected === 'string') {
          return selected === service._id;
        } else if (typeof selected === 'object' && selected.serviceId) {
          return selected.serviceId === service._id;
        } else if (typeof selected === 'object' && selected._id) {
          return selected._id === service._id;
        }
        return false;
      })
    );
    
    if (availableServices.length > 0) {
      const suggestions = [];
      const maxSuggestions = Math.min(3, availableServices.length);
      
      for (let i = 0; i < maxSuggestions; i++) {
        const service = availableServices[i];
        const discount = 0.10 + (i * 0.07);
        
        suggestions.push({
          service: service,
          gapSize: 25 + (i * 10),
          discount: Math.min(0.30, discount),
          estimatedPrice: service.discountedPrice || service.price || 0
        });
      }
      
      console.log('Generated comprehensive fallback suggestions:', suggestions);
      setAddonSuggestions(suggestions);
    } else {
      setAddonSuggestions([{
        service: {
          _id: 'complete_package',
          name: 'Complete Beauty Package',
          category: 'Package',
          price: 1000,
          discountedPrice: 750
        },
        gapSize: 90,
        discount: 0.25,
        estimatedPrice: 1000
      }]);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Validate date selection
  const validateDate = (selectedDate) => {
    if (!selectedDate) {
      setDateError("");
      return true;
    }

    const today = new Date();
    const selected = new Date(selectedDate);
    
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      setDateError("Please select a valid date. Past dates are not allowed.");
      return false;
    }

    setDateError("");
    return true;
  };

  // Handle date change with validation
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setAppointmentDate(selectedDate);
    validateDate(selectedDate);
  };

  // Select/deselect a package - adds all included services to booking
  const togglePackage = (pkg) => {
    console.log('Toggling package:', pkg);
    
    const isPackageSelected = selectedPackages.some(selectedPkg => selectedPkg._id === pkg._id);
    
    let newSelectedServices = [...selectedServices];
    let newSelectedPackages = [...selectedPackages];
    
    if (isPackageSelected) {
      const packageServiceIds = pkg.services.map(s => s.serviceId);
      newSelectedServices = selectedServices.filter(selected => {
        let serviceId;
        if (typeof selected === 'string') {
          serviceId = selected;
        } else if (typeof selected === 'object' && selected.serviceId) {
          serviceId = selected.serviceId;
        } else if (typeof selected === 'object' && selected._id) {
          serviceId = selected._id;
        }
        return !packageServiceIds.includes(serviceId);
      });
      newSelectedPackages = selectedPackages.filter(selectedPkg => selectedPkg._id !== pkg._id);
      toast.success(`Removed "${pkg.name}" package from booking`);
    } else {
      const servicesToAdd = pkg.services.map(service => ({
        serviceId: service.serviceId,
        packageName: pkg.name,
        packagePrice: service.price,
        isFromPackage: true
      }));
      
      newSelectedServices = [...selectedServices, ...servicesToAdd];
      newSelectedPackages = [...selectedPackages, pkg];
      toast.success(`Added "${pkg.name}" package to booking! (${pkg.services.length} services)`);
    }
    
    setSelectedServices(newSelectedServices);
    setSelectedPackages(newSelectedPackages);
    console.log('Updated selected services with package:', newSelectedServices);
    console.log('Updated selected packages:', newSelectedPackages);
    
    if (newSelectedServices.length > 0) {
      console.log('Package selected, triggering addon suggestions');
      setAddonSuggestions([]);
      setTimeout(() => {
        suggestAddonsBasedOnHistory();
      }, 300);
    } else {
      setAddonSuggestions([]);
      setSelectedAddons([]);
    }
  };

  // Enhanced service selection with automatic addon suggestion triggering
  const toggleService = (service) => {
    console.log('Toggling service:', service);
    
    const isPartOfPackage = selectedPackages.some(pkg => 
      pkg.services.some(pkgService => pkgService.serviceId === service._id)
    );
    
    if (isPartOfPackage) {
      toast.error('This service is already included in a selected package');
      return;
    }
    
    const exists = selectedServices.some(s => {
      if (typeof s === 'string') {
        return s === service._id;
      } else if (typeof s === 'object' && s.serviceId) {
        return s.serviceId === service._id;
      } else if (typeof s === 'object' && s._id) {
        return s._id === service._id;
      }
      return false;
    });
    
    let newSelectedServices;
    
    if (exists) {
      newSelectedServices = selectedServices.filter(s => {
        if (typeof s === 'string') {
          return s !== service._id;
        } else if (typeof s === 'object' && s.serviceId) {
          return s.serviceId !== service._id;
        } else if (typeof s === 'object' && s._id) {
          return s._id !== service._id;
        }
        return true;
      });
    } else {
      newSelectedServices = [...selectedServices, { serviceId: service._id }];
    }
    
    setSelectedServices(newSelectedServices);
    console.log('Updated selected services:', newSelectedServices);
    
    if (newSelectedServices.length > 0) {
      console.log('Service selected, triggering addon suggestions');
      setAddonSuggestions([]);
      setTimeout(() => {
        suggestAddonsBasedOnHistory();
      }, 300);
    } else {
      setAddonSuggestions([]);
      setSelectedAddons([]);
    }
  };

  // Toggle addon selection
  const toggleAddon = (addon) => {
    console.log('Toggling addon:', addon);
    const exists = selectedAddons.some(a => {
      if (typeof a === 'object' && a.serviceId) {
        return a.serviceId === addon.service._id;
      }
      return false;
    });
    if (exists) {
      console.log('Removing addon from selection');
      setSelectedAddons(selectedAddons.filter(a => {
        if (typeof a === 'object' && a.serviceId) {
          return a.serviceId !== addon.service._id;
        }
        return true;
      }));
    } else {
      console.log('Adding addon to selection');
      setSelectedAddons([...selectedAddons, { 
        serviceId: addon.service._id,
        serviceName: addon.service.name,
        price: addon.estimatedPrice * (1 - addon.discount),
        originalPrice: addon.estimatedPrice
      }]);
    }
    console.log('Updated selected addons:', selectedAddons);
  };

  // Toggle add-on offer selection from database
  const toggleOffer = (offer) => {
    console.log('Toggling offer:', offer);
    const exists = selectedOffers.some(o => o._id === offer._id);
    
    if (exists) {
      console.log('Removing offer from selection');
      setSelectedOffers(selectedOffers.filter(o => o._id !== offer._id));
    } else {
      console.log('Adding offer to selection');
      setSelectedOffers([...selectedOffers, offer]);
    }
  };

  // Add product to booking
  const handleAddProductToBooking = (product) => {
    console.log('Adding product to booking:', product);
    const exists = selectedProducts.find(p => p.productId === product._id);
    if (exists) {
      setSelectedProducts(selectedProducts.map(p => 
        p.productId === product._id 
          ? { ...p, quantity: p.quantity + 1 } 
          : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, { 
        productId: product._id,
        productName: product.name,
        price: product.discountedPrice || product.price,
        originalPrice: product.price,
        quantity: 1
      }]);
    }
    toast.success(`${product.name} added to your booking!`);
  };

  // Remove product from booking
  const handleRemoveProductFromBooking = (productId) => {
    console.log('Removing product from booking:', productId);
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
  };

  // Update product quantity
  const handleUpdateProductQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveProductFromBooking(productId);
      return;
    }
    
    setSelectedProducts(selectedProducts.map(p => 
      p.productId === productId 
        ? { ...p, quantity } 
        : p
    ));
  };

  const handleRedemptionChange = useCallback((data) => {
    setRedemptionData(prev => {
      if (prev.usePoints === data.usePoints && 
          prev.pointsToRedeem === data.pointsToRedeem && 
          prev.discountAmount === data.discountAmount) {
        return prev;
      }
      return data;
    });
  }, []);

  const calculateServiceTotal = () => {
    if (!salon || selectedServices.length === 0) return 0;
    
    if (selectedPackages.length > 0) {
      let total = 0;
      
      selectedPackages.forEach(pkg => {
        const packagePrice = pkg.discountedPrice ?? pkg.totalPrice ?? 0;
        total += Number(packagePrice);
      });
      
      const packageServiceIds = selectedPackages.flatMap(pkg => 
        pkg.services.map(s => s.serviceId)
      );
      
      const individualServices = selectedServices.filter(selected => {
        let serviceId;
        if (typeof selected === 'string') {
          serviceId = selected;
        } else if (typeof selected === 'object' && selected.serviceId) {
          serviceId = selected.serviceId;
        } else if (typeof selected === 'object' && selected._id) {
          serviceId = selected._id;
        }
        return !packageServiceIds.includes(serviceId);
      });
      
      individualServices.forEach(selected => {
        let serviceId;
        if (typeof selected === 'string') {
          serviceId = selected;
        } else if (typeof selected === 'object' && selected.serviceId) {
          serviceId = selected.serviceId;
        } else if (typeof selected === 'object' && selected._id) {
          serviceId = selected._id;
        }
        
        const service = salon.services.find(s => s._id === serviceId);
        if (service) {
          const price = service.discountedPrice ?? service.price ?? 0;
          total += Number(price);
        }
      });
      
      return total;
    }
    
    return selectedServices.reduce((total, selected) => {
      let serviceId;
      if (typeof selected === 'string') {
        serviceId = selected;
      } else if (typeof selected === 'object' && selected.serviceId) {
        serviceId = selected.serviceId;
      } else if (typeof selected === 'object' && selected._id) {
        serviceId = selected._id;
      }
      
      const service = salon.services.find(s => s._id === serviceId);
      if (service) {
        const price = service.discountedPrice ?? service.price ?? 0;
        return total + Number(price);
      }
      return total;
    }, 0);
  };

  const calculateAddonTotal = () => {
    return selectedAddons.reduce((total, addon) => total + Number(addon.price || 0), 0);
  };

  const calculateOffersTotal = () => {
    return selectedOffers.reduce((total, offer) => total + Number(offer.discountedPrice || 0), 0);
  };

  const calculateProductTotal = () => {
    return selectedProducts.reduce((total, product) => total + (Number(product.price || 0) * Number(product.quantity || 1)), 0);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (salon) {
      try {
        const policyResponse = await cancellationPolicyService.getPolicy(salon._id);
        if (policyResponse?.success && policyResponse.data.isActive) {
          if (!policyAgreed) {
            toast.error('Please agree to the cancellation policy before booking');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking cancellation policy:', error);
      }
    }
    
    try {
      if (!salon?._id || (selectedServices.length === 0 && selectedAddons.length === 0 && selectedOffers.length === 0) || !appointmentDate || !appointmentTime) {
        toast.error("Please select at least one service, add-on, or offer, along with date and time");
        return;
      }

      if (!validateDate(appointmentDate)) {
        toast.error("Please select a valid date. Past dates are not allowed.");
        return;
      }
      
      try {
        const serviceTotal = calculateServiceTotal();
        const addonTotal = calculateAddonTotal();
        const offersTotal = calculateOffersTotal();
        const totalAmount = serviceTotal + addonTotal + offersTotal;
        
        console.log('Booking details:', {
          salonId: salon._id,
          selectedServices,
          selectedAddons,
          selectedOffers,
          totalServices: selectedServices.length,
          totalAddons: selectedAddons.length,
          totalOffers: selectedOffers.length,
          totalAmount
        });
        
        if (redemptionData.usePoints && redemptionData.pointsToRedeem > 0) {
          if (redemptionData.pointsToRedeem > totalAmount) {
            toast.error("Points value cannot exceed service total");
            return;
          }
          
          if (redemptionData.pointsToRedeem < 100) {
            toast.error("Minimum redemption is 100 points");
            return;
          }
          
          if (redemptionData.pointsToRedeem % 100 !== 0) {
            toast.error("Points must be redeemed in multiples of 100");
            return;
          }
        }
        
        // For freelancers, we need to include full service details (price, duration, serviceName)
        // because the backend can't look them up from the database
        const allServices = isFreelancer
          ? [
              ...selectedServices.map(selected => {
                const serviceId = typeof selected === 'string' ? selected : (selected.serviceId || selected._id);
                const service = salon.services.find(s => s._id === serviceId);
                return {
                  serviceId: serviceId,
                  serviceName: service?.name || 'Service',
                  price: service?.discountedPrice ?? service?.price ?? 0,
                  duration: service?.duration || 60
                };
              }),
              ...selectedAddons.map(addon => ({
                serviceId: addon.serviceId,
                serviceName: addon.serviceName,
                price: addon.price,
                duration: 60 // Default duration for addons
              })),
              ...selectedOffers.map(offer => ({
                serviceId: offer._id,
                serviceName: offer.name,
                price: offer.discountedPrice || offer.price || 0,
                duration: 60, // Default duration for offers
                isOffer: true
              }))
            ]
          : [
              ...selectedServices,
              ...selectedAddons.map(addon => ({ serviceId: addon.serviceId })),
              ...selectedOffers.map(offer => ({ 
                serviceId: offer._id, 
                serviceName: offer.name,
                price: offer.discountedPrice || offer.price || 0,
                isOffer: true 
              }))
            ];
        
        console.log('All services to book:', allServices);
        
        // =========== ADDED: Home service fee calculation ===========
        const homeServiceFee = isHomeService ? 200 : 0;
        
        const payload = {
          ...(isFreelancer ? { freelancerId: salon._id } : { salonId: salon._id }),
          services: allServices,
          products: selectedProducts.map(product => ({
            productId: product.productId,
            quantity: product.quantity
          })),
          appointmentDate,
          appointmentTime,
          customerNotes,
          ...(isHomeService && {
            homeServiceAddress,
            isHomeService: true,
            homeServiceFee: homeServiceFee
          }),
          ...(redemptionData.usePoints && redemptionData.pointsToRedeem > 0 && {
            pointsToRedeem: redemptionData.pointsToRedeem,
            discountAmount: redemptionData.discountAmount
          })
        };        
        console.log('📤 Booking payload:', JSON.stringify(payload, null, 2));
        
        const res = await customerService.bookAppointment(payload);
        
        console.log('📥 Booking response:', res);
        
        if (res?.success) {
          console.log('✅ Appointment created:', {
            appointmentId: res.data._id,
            totalAmount: res.data.totalAmount,
            finalAmount: res.data.finalAmount,
            serviceCount: res.data.services?.length
          });
          
          setCreatedAppointment(res.data);
          setShowPaymentButton(true);
          
          toast.success("Appointment created! Please proceed with payment to confirm your booking.");
          
          if (redemptionData.usePoints && redemptionData.pointsToRedeem > 0) {
            toast.success(`Successfully redeemed ${redemptionData.pointsToRedeem} points for ₹${redemptionData.discountAmount} discount!`);
          }
        } else {
          toast.error(res?.message || "Failed to book appointment");
        }
      } catch (e) {
        console.error('Booking error:', e);
        toast.error(e?.response?.data?.message || "Failed to book appointment");
      }
    } catch (e) {
      console.error('Booking error:', e);
      toast.error(e?.response?.data?.message || "Failed to book appointment");
    }
  };


  
  const handleProceedToPay = async () => {
    if (!createdAppointment) return;
    
    setPaymentProcessing(true);
    
    try {
      const loadRazorpay = () => {
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => {
            resolve(true);
          };
          script.onerror = () => {
            resolve(false);
          };
          document.body.appendChild(script);
        });
      };

      const res = await loadRazorpay();
      if (!res) {
        toast.error('Failed to load payment gateway. Please try again.');
        setPaymentProcessing(false);
        return;
      }

      const { paymentService } = await import('../../services/payment');
      
      try {
        const orderResponse = await paymentService.createPaymentOrder(createdAppointment._id);
        
        if (!orderResponse?.success) {
          toast.error(orderResponse?.message || 'Failed to create payment order');
          setPaymentProcessing(false);
          return;
        }

        const orderData = orderResponse.data;
      
      const options = {
        key: 'rzp_test_RP6aD2gNdAuoRE',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Auracare Beauty Parlor',
        description: `Appointment Payment for ${orderData.salonName}`,
        image: 'https://example.com/your_logo.png',
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyResponse = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointmentId: orderData.appointmentId
            });
            
            if (verifyResponse?.success) {
              toast.success('Payment successful! Appointment confirmed.');
              
              // Create addon sales records if any offers were selected
              if (selectedOffers.length > 0) {
                try {
                  const salesResponse = await addOnOfferService.createAddonSales(
                    orderData.appointmentId,
                    selectedOffers
                  );
                  console.log('Addon sales records created:', salesResponse);
                } catch (salesError) {
                  console.error('Failed to create addon sales records:', salesError);
                  // Don't block the success flow if sales recording fails
                }
              }
              
              setSelectedServices([]);
              setSelectedAddons([]);
              setSelectedOffers([]);
              setAppointmentDate("");
              setAppointmentTime("");
              setCustomerNotes("");
              setRedemptionData({
                usePoints: false,
                pointsToRedeem: 0,
                discountAmount: 0
              });
              setShowPaymentButton(false);
              setCreatedAppointment(null);
              
              setTimeout(() => {
                navigate("/customer/bookings");
              }, 1500);
            } else {
              toast.error(verifyResponse?.message || 'Payment verification failed');
              setPaymentProcessing(false);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
            setPaymentProcessing(false);
          }
        },
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
        },
        notes: {
          appointment_id: orderData.appointmentId,
          salon_name: orderData.salonName,
          services: orderData.services
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: async function() {
            try {
              await paymentService.handlePaymentFailure({
                appointmentId: orderData.appointmentId,
                error: 'Payment cancelled by user'
              });
              toast.error('Payment cancelled. Your appointment is still pending.');
            } catch (error) {
              console.error('Error handling payment failure:', error);
            }
            setPaymentProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      } catch (paymentOrderError) {
        console.error('Error creating payment order:', paymentOrderError);
        const errorMessage = paymentOrderError.message || 'Failed to create payment order. Please try again.';
        toast.error(errorMessage);
        setPaymentProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Failed to process payment. Please try again.';
      toast.error(errorMessage);
      setPaymentProcessing(false);
    }
  };

  const serviceTotal = calculateServiceTotal();
  const addonTotal = calculateAddonTotal();
  const offersTotal = calculateOffersTotal();
  const productTotal = calculateProductTotal();
  const homeServiceFee = isHomeService ? 200 : 0; // Add home service fee
  const overallTotal = serviceTotal + addonTotal + offersTotal + productTotal + homeServiceFee;
  const finalAmount = redemptionData.usePoints 
    ? Math.max(0, overallTotal - redemptionData.discountAmount) 
    : overallTotal;
  
  const filteredServices = useMemo(() => {
    if (!salon?.services) return [];
    
    let filtered = salon.services;
    
    if (budget && !isNaN(budget)) {
      const budgetValue = parseFloat(budget);
      filtered = filtered.filter(service => {
        const servicePrice = service.discountedPrice ?? service.price ?? 0;
        return servicePrice <= budgetValue;
      });
    }
    
    if (serviceSearch.trim()) {
      const searchTerm = serviceSearch.toLowerCase().trim();
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm) ||
        service.category.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  }, [salon?.services, budget, serviceSearch]);

  if (loading) {
    return <LoadingSpinner text="Loading appointment details..." />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <BackButton fallbackPath="/customer/dashboard" className="mb-4" />
      <h1 className="text-2xl font-semibold mb-4">
        {isHomeService ? 'Book Home Service' : 'Book Appointment'}
      </h1>
      {!salon ? (
        <div className="bg-white rounded-md shadow p-6">
          <h2 className="text-lg font-semibold mb-3">{isHomeService ? 'Select a Freelancer' : 'Select a Salon'}</h2>
          {salonsLoading ? (
            <LoadingSpinner />
          ) : salonList.length === 0 ? (
            <p className="text-sm text-gray-500">No approved {isHomeService ? 'freelancers' : 'salons'} available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {salonList.map(s => {
                const logo = s.documents?.salonLogo || null;
                const address = typeof s.salonAddress === 'string' ? s.salonAddress : [s.salonAddress?.city, s.salonAddress?.state].filter(Boolean).join(', ');
                return (
                  <Link key={s._id} to={`/customer/book-appointment/${s._id}${isHomeService ? '?homeService=true' : ''}`} className="border rounded-lg p-3 hover:shadow">
                    <div className="flex items-center mb-2">
                      {logo ? (
                        <img 
                          src={logo.startsWith('http') ? logo : `${import.meta.env.VITE_API_URL || ''}${logo}`} 
                          alt={s.salonName} 
                          className="h-10 w-10 rounded object-cover border mr-2" 
                          onError={(e)=>{e.currentTarget.style.display='none'}} 
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-100 rounded mr-2" />
                      )}
                      <div>
                        <p className="font-medium">{s.salonName}</p>
                        {address && <p className="text-xs text-gray-500">{address}</p>}
                      </div>
                    </div>
                    <span className="text-sm text-primary-600">Book here →</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-md shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">{salon.name || salon.salonName}</h2>
              {isHomeService && (
                <div className="flex items-center mt-1 text-purple-600">
                  <Home className="h-4 w-4 mr-1" />
                  <span className="text-sm">Home Service Available</span>
                </div>
              )}
            </div>
            {isHomeService && (
              <div className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-medium">
                <Home className="h-3 w-3 inline mr-1" />
                Home Service
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {/* Budget Finder Section */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                  <span className="bg-blue-500 text-white p-1 rounded mr-2">💰</span>
                  Budget Finder
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Max Budget (₹)
                    </label>
                    <input 
                      type="number" 
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="Enter budget"
                      className="w-full border border-blue-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Search Service
                    </label>
                    <input 
                      type="text" 
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      placeholder="Hair cut, massage, etc."
                      className="w-full border border-blue-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button 
                      onClick={() => {
                        setBudget('');
                        setServiceSearch('');
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors flex items-center justify-center"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Clear Filters
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-blue-700 bg-blue-100 rounded p-2">
                  Showing {filteredServices.length} of {salon?.services?.length || 0} services
                  {(budget || serviceSearch) && (
                    <span className="ml-2 font-medium">
                      • Filters applied: 
                      {budget && <span className="ml-1">Budget ≤ ₹{budget}</span>}
                      {budget && serviceSearch && <span>, </span>}
                      {serviceSearch && <span className="ml-1">Search: \"{serviceSearch}\"</span>}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Horizontal Navigation Bar */}
              {!isHomeService && (
                <div className="mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-4" aria-label="Tabs">
                      <button
                        onClick={() => setActiveTab('services')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === 'services'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Individual Services
                      </button>
                      <button
                        onClick={() => setActiveTab('giftcards')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === 'giftcards'
                            ? 'border-pink-500 text-pink-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Gift Cards
                      </button>
                      <button
                        onClick={() => setActiveTab('packages')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === 'packages'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Packages
                      </button>
                    </nav>
                  </div>
                </div>
              )}
              
              {/* Tab Content Area */}
              {/* Services Tab - Default */}
              {(isHomeService || activeTab === 'services') && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Select Services</h3>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-auto border rounded p-3">
                    {filteredServices.map(s => {
                      const checked = !!selectedServices.some(x => {
                        if (typeof x === 'string') {
                          return x === s._id;
                        } else if (typeof x === 'object' && x.serviceId) {
                          return x.serviceId === s._id;
                        } else if (typeof x === 'object' && x._id) {
                          return x._id === s._id;
                        }
                        return false;
                      });
                      const isPartOfPackage = selectedPackages.some(pkg => 
                        pkg.services.some(pkgService => pkgService.serviceId === s._id)
                      );
                      const isDisabled = isPartOfPackage;
                      
                      return (
                        <label 
                          key={s._id} 
                          className={`flex items-center justify-between py-1 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span>
                            <span className="font-medium">{s.name}</span>
                            <span className="text-xs text-gray-500 ml-2">{s.category}</span>
                            {isPartOfPackage && (
                              <span className="text-xs text-orange-600 ml-2 font-medium">(In Package)</span>
                            )}
                          </span>
                          <span className="text-sm text-gray-700">₹{(s.discountedPrice ?? s.price) || 0}</span>
                          <input 
                            type="checkbox" 
                            className="ml-3" 
                            checked={checked} 
                            onChange={() => !isDisabled && toggleService(s)} 
                            disabled={isDisabled}
                          />
                        </label>
                      );
                    })}
                    {filteredServices.length === 0 && (
                      <p className="text-sm text-gray-500">No services available.</p>
                    )}
                  </div>
                </>
              )}
              
              {/* Gift Cards Tab */}
              {!isHomeService && activeTab === 'giftcards' && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Gift Cards</h3>
                  {giftCardsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span className="text-gray-600">Loading gift cards...</span>
                    </div>
                  ) : giftCards.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      <p className="text-gray-500">No gift cards available at this time.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {giftCards.map(card => (
                        <div 
                          key={card._id} 
                          className="border-2 border-pink-200 rounded-lg p-4 bg-gradient-to-r from-pink-50 to-purple-50 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-lg text-gray-900">{card.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{card.description}</p>
                              
                              <div className="flex items-center mt-3">
                                <span className="text-2xl font-bold text-pink-600">₹{card.value}</span>
                                {card.discountedValue && card.discountedValue < card.value && (
                                  <>
                                    <span className="ml-2 text-sm text-gray-500 line-through">₹{card.value}</span>
                                    <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                      Save ₹{card.value - card.discountedValue}
                                    </span>
                                  </>
                                )}
                              </div>
                              
                              <div className="flex gap-2 mt-2">
                                {card.category && (
                                  <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded">
                                    {card.category}
                                  </span>
                                )}
                                {card.validityDays && (
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                    Valid for {card.validityDays} days
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => {
                                navigate(`/customer/gift-cards/${salonId}`);
                              }}
                              className="ml-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Packages Tab */}
              {!isHomeService && activeTab === 'packages' && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Recommended Packages</h3>
                  {packagesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span className="text-gray-600">Loading packages...</span>
                    </div>
                  ) : packages.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-gray-500">No packages available at this time.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {packages.map(pkg => {
                        const packageServiceIds = pkg.services.map(s => s.serviceId);
                        const isSelected = packageServiceIds.some(id => 
                          selectedServices.some(selected => {
                            if (typeof selected === 'string') {
                              return selected === id;
                            } else if (typeof selected === 'object' && selected.serviceId) {
                              return selected.serviceId === id;
                            } else if (typeof selected === 'object' && selected._id) {
                              return selected._id === id;
                            }
                            return false;
                          })
                        );
                        
                        const individualTotal = pkg.services.reduce((total, pkgService) => {
                          const service = salon?.services?.find(s => s._id === pkgService.serviceId);
                          return total + (service ? (service.discountedPrice ?? service.price ?? 0) : 0);
                        }, 0);
                        
                        const savings = individualTotal - (pkg.discountedPrice ?? pkg.totalPrice ?? 0);
                        const savingsPercentage = individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;
                        
                        return (
                          <div 
                            key={pkg._id} 
                            className={`flex items-start justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-orange-500 bg-orange-50 shadow-md' 
                                : 'border-orange-200 hover:border-orange-400 hover:bg-orange-50'
                            }`}
                            onClick={() => togglePackage(pkg)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-gray-900 text-lg">{pkg.name}</span>
                                {isSelected && (
                                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                    SELECTED
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                              
                              <div className="flex flex-wrap gap-1 mb-2">
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {pkg.category}
                                </span>
                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                  {pkg.occasionType}
                                </span>
                                {savings > 0 && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">
                                    Save ₹{savings} ({savingsPercentage}% off)
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-sm text-gray-500 mb-2">
                                Includes {pkg.services.length} service{pkg.services.length !== 1 ? 's' : ''}:
                                {pkg.services.slice(0, 3).map((service, idx) => {
                                  const serviceName = service.serviceName || 
                                    salon?.services?.find(s => s._id === service.serviceId)?.name || 
                                    'Unknown Service';
                                  return (
                                    <span key={idx} className="inline-block mr-2">
                                      {serviceName}{idx < Math.min(2, pkg.services.length - 1) ? ',' : ''}
                                    </span>
                                  );
                                })}
                                {pkg.services.length > 3 && (
                                  <span className="text-gray-400">+{pkg.services.length - 3} more</span>
                                )}
                              </div>
                              
                              <div className="flex items-center">
                                <span className="text-xl font-bold text-orange-600">
                                  ₹{pkg.discountedPrice ?? pkg.totalPrice ?? 0}
                                </span>
                                {individualTotal > (pkg.discountedPrice ?? pkg.totalPrice ?? 0) && (
                                  <span className="ml-2 text-sm text-gray-500 line-through">₹{individualTotal}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="ml-3 flex flex-col items-center justify-center">
                              <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                                isSelected 
                                  ? 'border-orange-500 bg-orange-500' 
                                  : 'border-orange-300 hover:border-orange-500'
                              }`}>
                                {isSelected ? (
                                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 mt-1 text-center">
                                {isSelected ? 'Remove' : 'Select'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              
              {/* Recommended Products - Only for salons */}
              {!isHomeService && recommendedProducts.length > 0 && (
                <div className="mt-4 border-2 border-dashed border-purple-300 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-purple-800 flex items-center text-lg">
                      <span className="bg-purple-500 text-white p-1 rounded mr-2">🛍️</span>
                      Recommended Products
                    </h3>
                  </div>
                  <p className="text-sm text-purple-700 mb-3">Enhance your experience with these quality products!</p>
                  
                  <div className="space-y-3 border rounded-lg p-3 bg-white shadow-sm max-h-60 overflow-y-auto">
                    {recommendedProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 hover:bg-purple-50 rounded transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{product.name}</span>
                            {product.discountedPrice && product.discountedPrice < product.price && (
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                Save ₹{product.price - product.discountedPrice}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center mt-1">
                            <span className="text-lg font-bold text-purple-600">
                              ₹{product.discountedPrice || product.price}
                            </span>
                            {product.discountedPrice && product.discountedPrice < product.price && (
                              <span className="ml-2 text-sm text-gray-500 line-through">₹{product.price}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {product.category}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleAddProductToBooking(product)}
                          className="ml-3 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-on Offers from Database - Only show if offers exist */}
              {!isFreelancer && (
                <div className="mt-4 border-2 border-dashed border-blue-300 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-blue-800 flex items-center text-lg">
                      <span className="bg-blue-500 text-white p-1 rounded mr-2">🎁</span>
                      Special Add-on Offers
                    </h3>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">Enhance your {isHomeService ? 'home service' : 'salon'} experience with these exclusive offers!</p>
                  
                  {addOnOffersLoading ? (
                    <div className="text-center py-6">
                      <div className="flex justify-center mb-3">
                        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-blue-700 font-medium">Loading special offers...</p>
                    </div>
                  ) : addOnOffers.length > 0 ? (
                    <div className="space-y-3 border rounded-lg p-3 bg-white shadow-sm">
                      {addOnOffers.map((offer) => {
                        const checked = selectedOffers.some(o => o._id === offer._id);
                        const savings = offer.basePrice - offer.discountedPrice;
                        const discountPercent = Math.round((savings / offer.basePrice) * 100);
                        
                        return (
                          <div key={offer._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 rounded transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-900">{offer.serviceName}</span>
                                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                  Save ₹{savings.toFixed(0)}
                                </span>
                              </div>
                              {offer.description && (
                                <p className="text-xs text-gray-600 mt-1">{offer.description}</p>
                              )}
                              <div className="flex items-center mt-1">
                                <span className="text-lg font-bold text-green-600">₹{offer.discountedPrice.toFixed(0)}</span>
                                <span className="ml-2 text-sm text-gray-500 line-through">₹{offer.basePrice}</span>
                                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {discountPercent}% OFF
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>Valid until {new Date(offer.endDate).toLocaleDateString()}</span>
                              </div>
                              {offer.termsAndConditions && (
                                <p className="text-xs text-gray-500 mt-1 italic">T&C: {offer.termsAndConditions}</p>
                              )}
                            </div>
                            <input 
                              type="checkbox" 
                              className="ml-3 h-6 w-6 text-blue-600 rounded focus:ring-blue-500 border-2"
                              checked={checked} 
                              onChange={() => toggleOffer(offer)} 
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600">No special offers available at this time.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Loyalty Redemption Widget */}
              {(selectedServices.length > 0 || selectedAddons.length > 0 || selectedOffers.length > 0) && user?.id && (
                <div className="mt-4">
                  <LoyaltyRedemptionWidget
                    customerId={user.id}
                    serviceTotal={overallTotal}
                    onRedemptionChange={handleRedemptionChange}
                    initialRedeemPoints={redemptionData.usePoints}
                  />
                </div>
              )}
              
              {/* Payment Button */}
              {showPaymentButton && createdAppointment && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Proceed to Payment</h3>
                  <p className="text-blue-700 mb-4">
                    Your appointment has been created. Please proceed with payment to confirm your booking.
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-xl font-bold text-gray-900">₹{createdAppointment.finalAmount}</p>
                    </div>
                    <button
                      onClick={handleProceedToPay}
                      disabled={paymentProcessing}
                      className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                    >
                      {paymentProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        `Proceed to Pay ₹${createdAppointment.finalAmount}`
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium mb-2">Select Date & Time</h3>
              <p className="text-sm text-gray-600 mb-3">
                📅 You can only book appointments for today or future dates
              </p>
              <div className="space-y-3">
                <div>
                  <input 
                    type="date" 
                    value={appointmentDate} 
                    onChange={handleDateChange}
                    min={getTodayDate()}
                    className={`w-full border rounded px-3 py-2 ${dateError ? 'border-red-500' : ''}`}
                  />
                  {dateError && (
                    <p className="text-red-500 text-sm mt-1">{dateError}</p>
                  )}
                </div>
                <input type="time" value={appointmentTime} onChange={(e)=>setAppointmentTime(e.target.value)} className="w-full border rounded px-3 py-2" />
                <textarea placeholder="Notes (optional)" value={customerNotes} onChange={(e)=>setCustomerNotes(e.target.value)} className="w-full border rounded px-3 py-2" rows={3} />
                
                {/* =========== ADDED: Home Service Address Section =========== */}
                {isHomeService && (
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Home className="h-5 w-5 text-purple-600 mr-2" />
                      <h4 className="font-medium text-purple-800">Home Service Details</h4>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-1">
                        Service Address
                      </label>
                      <textarea
                        value={homeServiceAddress}
                        onChange={(e) => setHomeServiceAddress(e.target.value)}
                        placeholder="Enter the complete address where service will be provided..."
                        className="w-full border border-purple-300 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        rows="3"
                        required={isHomeService}
                      />
                      <p className="text-xs text-purple-600 mt-1">
                        Please ensure someone is available at this address during the appointment time
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Booking Summary */}
                {(selectedServices.length > 0 || selectedAddons.length > 0 || selectedOffers.length > 0) && (
                  <div className="border rounded p-3 bg-gray-50">
                    <h4 className="font-medium mb-2">Booking Summary</h4>
                    {selectedServices.map((selected, index) => {
                      let serviceId;
                      if (typeof selected === 'string') {
                        serviceId = selected;
                      } else if (typeof selected === 'object' && selected.serviceId) {
                        serviceId = selected.serviceId;
                      } else if (typeof selected === 'object' && selected._id) {
                        serviceId = selected._id;
                      }
                      
                      const service = salon.services.find(s => s._id === serviceId);
                      if (!service) return null;
                      return (
                        <div key={index} className="flex justify-between text-sm py-1">
                          <span>{service.name}</span>
                          <span>₹{service.discountedPrice ?? service.price ?? 0}</span>
                        </div>
                      );
                    })}
                    {selectedAddons.map((addon, index) => (
                      <div key={index} className="flex justify-between text-sm py-1">
                        <span>{addon.serviceName} (Add-on)</span>
                        <span>₹{addon.price}</span>
                      </div>
                    ))}
                    {selectedOffers.map((offer, index) => (
                      <div key={index} className="flex justify-between text-sm py-1 text-indigo-600">
                        <span>{offer.name} (Offer)</span>
                        <span>₹{offer.discountedPrice || offer.price || 0}</span>
                      </div>
                    ))}
                    {isHomeService && (
                      <div className="flex justify-between text-sm py-1 text-purple-600">
                        <span>
                          <Home className="h-3 w-3 inline mr-1" />
                          Home Service Fee
                        </span>
                        <span>₹{homeServiceFee}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-300 my-2 pt-2">
                      <div className="flex justify-between font-medium">
                        <span>Subtotal</span>
                        <span>₹{serviceTotal + addonTotal + calculateOffersTotal() + productTotal}</span>
                      </div>
                      {isHomeService && (
                        <div className="flex justify-between text-sm text-purple-600">
                          <span>Home Service Fee</span>
                          <span>+ ₹{homeServiceFee}</span>
                        </div>
                      )}
                      {redemptionData.usePoints && redemptionData.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Points Discount</span>
                          <span>- ₹{redemptionData.discountAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-lg mt-1">
                        <span>Final Amount</span>
                        <span>₹{finalAmount.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={handleBooking} 
                  disabled={!!dateError || (selectedServices.length === 0 && selectedAddons.length === 0 && selectedOffers.length === 0) || (isHomeService && !homeServiceAddress.trim())}
                  className={`px-4 py-2 text-white rounded ${!!dateError || (selectedServices.length === 0 && selectedAddons.length === 0 && selectedOffers.length === 0) || (isHomeService && !homeServiceAddress.trim()) ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
                >
                  {isHomeService ? 'Book Home Service' : 'Book Appointment'}
                </button>
                
                {/* Cancellation Policy Agreement - Only show when services/addons/offers are selected */}
                {(selectedServices.length > 0 || selectedAddons.length > 0 || selectedOffers.length > 0) && (
                  <div className="mt-4">
                    <CancellationPolicyDisplay 
                      salonId={salon._id} 
                      onAgreeChange={setPolicyAgreed} 
                    />
                  </div>
                )}
              </div>
              
              {/* Display salon availability when a date is selected */}
              {!isHomeService && (
                <SalonAvailabilityDisplay 
                  salonId={salon._id} 
                  selectedDate={appointmentDate}
                  isHomeService={isHomeService}
                />
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Debug button for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={async () => {
              console.log('=== DEBUG INFO ===');
              console.log('salonId:', salonId);
              console.log('isHomeService:', isHomeService);
              console.log('isFreelancer:', isFreelancer);
              console.log('salon data:', salon);
              console.log('=================');
            }}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm"
          >
            Debug
          </button>
        </div>
      )}
      

    </div>
  );
};

export default BookAppointment;