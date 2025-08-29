<<<<<<< HEAD
import { useState } from "react";
=======
import { useState, useEffect } from "react";
>>>>>>> main
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Calculator, Loader2 } from "lucide-react";
import type { ComprehensiveProjectInput } from "@shared/schema";

const projectSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  buildingUse: z.string().min(1, "Building use is required"),
  buildingType: z.string().min(1, "Building type is required"),

  designLevel: z.number().min(1).max(3),
  category: z.number().min(1).max(5),
  newBuildingArea: z.number().min(0),
  existingBuildingArea: z.number().min(0),
  siteArea: z.number().min(0),
  historicMultiplier: z.number().min(1),
  remodelMultiplier: z.number().min(0).max(1),
  newConstructionTargetCost: z.number().optional(),
  remodelTargetCost: z.number().optional(),
  shellShareOverride: z.number().min(0).max(1).optional(),
  interiorShareOverride: z.number().min(0).max(1).optional(),
  landscapeShareOverride: z.number().min(0).max(1).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedBuildingUse, setSelectedBuildingUse] = useState("");

  const [isHistoric, setIsHistoric] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const totalSteps = 4;

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectName: "",
      buildingUse: "",
      buildingType: "",

      designLevel: 2,
      category: 3,
      newBuildingArea: 10000,
      existingBuildingArea: 0,
      siteArea: 0,
      historicMultiplier: 1.0,
      remodelMultiplier: 0.5,
    },
  });

  // Fetch building uses
  const { data: buildingUses = [] } = useQuery<string[]>({
    queryKey: ['/api/building-uses'],
  });

  // Fetch building types when use is selected
  const { data: buildingTypes = [] } = useQuery<string[]>({
    queryKey: ['/api/building-uses', selectedBuildingUse, 'types'],
    enabled: !!selectedBuildingUse,
  });

<<<<<<< HEAD


  // Fetch category multipliers
=======
  // Fetch category for selected building type
  const selectedBuildingType = form.watch('buildingType');
  const { data: buildingCategory } = useQuery<{ category: number }>({
    queryKey: ['/api/building-types', selectedBuildingType, 'category'],
    enabled: !!selectedBuildingType,
  });

  // Fetch category multipliers to show description
>>>>>>> main
  const { data: categoryMultipliers = [] } = useQuery<Array<{ category: number; description: string; multiplier: string }>>({
    queryKey: ['/api/category-multipliers'],
  });

<<<<<<< HEAD
=======
  // Auto-set category when building type changes
  useEffect(() => {
    if (buildingCategory?.category) {
      form.setValue('category', buildingCategory.category);
    }
  }, [buildingCategory, form]);

>>>>>>> main
  const createProjectMutation = useMutation({
    mutationFn: async (data: ComprehensiveProjectInput) => {
      const response = await apiRequest('POST', '/api/projects/calculate', data);
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      navigate(`/projects/${result.project.id}`);
    },
  });

  const handleNext = () => {
    console.log(`Advancing from step ${step} to step ${step + 1}`);
    const fieldsToValidate = getFieldsForStep(step);
    form.trigger(fieldsToValidate).then((isValid) => {
      if (isValid) {
        setStep(step + 1);
        console.log(`Successfully advanced to step ${step + 1}`);
      } else {
        console.log(`Validation failed for step ${step}`, form.formState.errors);
      }
    });
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = (data: ProjectFormData) => {
    console.log(`Form submitted on step ${step}`);
    
    // Only allow submission on the final step
    if (step !== totalSteps) {
      console.log(`Preventing submission - not on final step (current: ${step}, total: ${totalSteps})`);
      return;
    }
<<<<<<< HEAD
=======

    // Prevent accidental double submission
    if (createProjectMutation.isPending) {
      console.log('Preventing double submission - mutation already pending');
      return;
    }
>>>>>>> main
    
    // Map design level to building tier
    const tierMap: Record<number, string> = {
      1: 'Low-end',
      2: 'Mid', 
      3: 'High-end'
    };
    
    const input: ComprehensiveProjectInput = {
      ...data,
      buildingTier: tierMap[data.designLevel] || 'Mid', // Automatically set tier based on design level
      historicMultiplier: isHistoric ? 1.2 : 1.0,
    };
    createProjectMutation.mutate(input);
  };

  const getFieldsForStep = (currentStep: number): (keyof ProjectFormData)[] => {
    switch (currentStep) {
      case 1:
        return ["projectName", "buildingUse", "buildingType"];
      case 2:
        return ["designLevel", "category"];
      case 3:
        return ["newBuildingArea", "existingBuildingArea", "siteArea"];
      case 4:
        return ["historicMultiplier", "remodelMultiplier"];
      default:
        return [];
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            Configure your project parameters to calculate engineering costs and fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={(step / totalSteps) * 100} className="mb-8" />
          
          <Form {...form}>
<<<<<<< HEAD
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
=======
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" onKeyDown={(e) => {
              // Prevent form submission on Enter key except for the submit button
              if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                e.preventDefault();
              }
            }}>
>>>>>>> main
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Project Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buildingUse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building Use</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedBuildingUse(value);
                            form.setValue("buildingType", "");
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select building use" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {buildingUses.map((use) => (
                              <SelectItem key={use} value={use}>
                                {use}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buildingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!selectedBuildingUse}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select building type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {buildingTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Design Parameters</h3>

                  <FormField
                    control={form.control}
                    name="designLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Design Level</FormLabel>
                        <FormDescription>
                          Choose the cost tier and complexity level of your design
                        </FormDescription>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="1" id="level1" />
                                <Label htmlFor="level1">Level 1 - Low-end</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="2" id="level2" />
                                <Label htmlFor="level2">Level 2 - Mid-range</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="3" id="level3" />
                                <Label htmlFor="level3">Level 3 - High-end</Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
<<<<<<< HEAD

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Category</FormLabel>
                        <FormDescription>
                          Select the project complexity category
                        </FormDescription>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoryMultipliers.map((cat) => (
                              <SelectItem key={cat.category} value={cat.category.toString()}>
                                Category {cat.category} - {cat.description} (×{cat.multiplier})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
=======
>>>>>>> main
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Building Areas</h3>

                  <FormField
                    control={form.control}
                    name="newBuildingArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Building Area (ft²)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the square footage of new construction
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="existingBuildingArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Existing Building Area (ft²)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the square footage of existing building to be remodeled
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="siteArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Area (ft²)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the total site area for landscaping calculations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Parameters</h3>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="historic"
                        checked={isHistoric}
                        onCheckedChange={(checked) => {
                          setIsHistoric(checked as boolean);
                          form.setValue("historicMultiplier", checked ? 1.2 : 1.0);
                        }}
                      />
                      <Label htmlFor="historic">
                        Historic Property (20% cost increase)
                      </Label>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="remodelMultiplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remodel Cost Factor</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0.5)}
                          />
                        </FormControl>
                        <FormDescription>
                          Percentage of new construction cost for remodeling (0.5 = 50%)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="advanced"
                        checked={showAdvanced}
                        onCheckedChange={(checked) => setShowAdvanced(checked as boolean)}
                      />
                      <Label htmlFor="advanced">
                        Show Advanced Options
                      </Label>
                    </div>
                  </div>

                  {showAdvanced && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <h4 className="font-medium">Cost Overrides</h4>
                      
                      <FormField
                        control={form.control}
                        name="newConstructionTargetCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Construction Target Cost ($/ft²)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Auto-calculated"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="remodelTargetCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Remodel Target Cost ($/ft²)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Auto-calculated"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <h4 className="font-medium mt-4">Share Overrides</h4>

                      <FormField
                        control={form.control}
                        name="shellShareOverride"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shell/Architecture Share</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                placeholder="Auto-calculated"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="interiorShareOverride"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interior Design Share</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                placeholder="Auto-calculated"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="landscapeShareOverride"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Landscape Share</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                placeholder="Auto-calculated"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 1}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                {step < totalSteps ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={createProjectMutation.isPending}>
                    {createProjectMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Calculator className="mr-2 h-4 w-4" />
                        Create Project
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}